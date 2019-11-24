import {FragmentBFF} from "./fragment";
import {Api} from "./api";
import {
  CONTENT_REPLACE_SCRIPT,
  DEFAULT_MAIN_PARTIAL,
  FRAGMENT_RENDER_MODES,
  HEALTHCHECK_PATHS,
  HTTP_METHODS,
  HTTP_STATUS_CODE,
  RESOURCE_INJECT_TYPE,
  RESOURCE_JS_EXECUTE_TYPE,
} from "./enums";
import {PREVIEW_PARTIAL_QUERY_NAME, RENDER_MODE_QUERY_NAME, VERSION_QUERY_NAME} from "./config";
import {
  FragmentModel,
  ICookieMap,
  IExposeConfig,
  IExposeFragment,
  IFragmentBFF,
  IFragmentResponse,
  IGatewayBFFConfiguration
} from "./types";
import md5 from "md5";
import async from "async";
import path from "path";
import express from "express";
import {Server} from "./network";
import {container, TYPES} from "./base";
import cheerio from "cheerio";
import {callableOnce, sealed} from "./decorators";
import {GatewayConfigurator} from "./configurator";
import {Template} from "./template";
import {Logger} from "./logger";
import cors from "cors";
import routeCache from "route-cache";
import {RESOURCE_TYPE} from "@puzzle-js/client-lib/dist/enums";
import ResourceInjector from "./resource-injector";
import {LIB_CONTENT} from "./util";

const logger = container.get(TYPES.Logger) as Logger;

@sealed
export class GatewayBFF {
  get url(): string {
    return this.config.url;
  }

  get name(): string {
    return this.config.name;
  }

  exposedConfig: IExposeConfig;
  server: Server;
  private config: IGatewayBFFConfiguration;
  private fragments: { [name: string]: FragmentBFF } = {};
  private apis: { [name: string]: Api } = {};
  ready = false;

  /**
   * Gateway constructor
   * @param {IGatewayBFFConfiguration} gatewayConfig
   * @param {Server} _server
   */
  constructor(gatewayConfig: IGatewayBFFConfiguration | GatewayConfigurator, _server?: Server) {
    this.config = gatewayConfig.hasOwnProperty('configuration') ? (gatewayConfig as GatewayConfigurator).configuration : (gatewayConfig as IGatewayBFFConfiguration);
    this.server = _server || new Server(this.config.serverOptions);
    this.bootstrap();
  }


  /**
   * Starts gateway
   */
  @callableOnce
  init(cb?: Function) {
    async.series([
      this.addCorsPlugin.bind(this),
      this.addCustomHeaders.bind(this),
      this.addPlaceholderRoutes.bind(this),
      this.addErrorPageRoutes.bind(this),
      this.addApiRoutes.bind(this),
      this.addStaticRoutes.bind(this),
      this.addHealthCheckRoutes.bind(this),
      this.addFragmentRoutes.bind(this),
      this.addConfigurationRoute.bind(this)
    ], err => {
      if (!err) {
        logger.info(`Gateway is listening on port ${this.config.serverOptions.port}`);
        this.server.listen(cb as () => void);
      } else {
        throw err;
      }
    });
  }

  /**
   * Adds api routes
   * @param {Function} cb
   */
  private addApiRoutes(cb: Function) {
    this.config.api.forEach(apiConfig => {
      this.apis[apiConfig.name] = new Api(apiConfig);
      this.apis[apiConfig.name].registerEndpoints(this.server);
    });
    cb();
  }

  /**
   * Creates expose config
   * @returns {IExposeConfig}
   */
  private createExposeConfig(): IExposeConfig {
    return {
      fragments: this.config.fragments.reduce((fragmentList: { [name: string]: IExposeFragment }, fragment) => {
        fragmentList[fragment.name] = {
          version: fragment.version,
          render: fragment.render,
          assets: fragment.versions[fragment.version].assets,
          dependencies: fragment.versions[fragment.version].dependencies,
          testCookie: fragment.testCookie,
          prg: !!fragment.prg,
          passiveVersions: Object.keys(fragment.versions).filter(v => v !== fragment.version).reduce((versionInfo, version) => (
            {
              ...versionInfo,
              [version]: {
                assets: fragment.versions[version].assets,
                dependencies: fragment.versions[version].dependencies
              }
            }
          ), {})
        };

        if (fragment.warden) {
          fragmentList[fragment.name].warden = fragment.warden;
        }

        if (fragment.versionMatcher) {
          fragmentList[fragment.name].versionMatcher = fragment.versionMatcher.toString();
        }

        this.fragments[fragment.name] = new FragmentBFF(fragment);

        return fragmentList;
      }, {}),
      hash: '',
    };
  }

  /**
   * Renders a fragment with desired version and renderMode
   * @param req
   * @param {string} fragmentName
   * @param {FRAGMENT_RENDER_MODES} renderMode
   * @param {string} partial
   * @param res
   * @param cookie
   * @param {string} forcedVersion
   * @returns {Promise<IFragmentResponse>}
   */
  async renderFragment(req: express.Request, fragmentName: string, renderMode: FRAGMENT_RENDER_MODES = FRAGMENT_RENDER_MODES.PREVIEW, partial: string, res: express.Response, cookie: ICookieMap, forcedVersion?: string): Promise<void> {
    const fragment = this.fragments[fragmentName];
    if (fragment) {
      const version = this.detectVersion(fragment, cookie, forcedVersion);
      const fragmentContent = await fragment.render(req, version);

      const gatewayContent = {
        content: fragmentContent,
        $status: +(fragmentContent.$status || HTTP_STATUS_CODE.OK),
        $headers: fragmentContent.$headers || {},
        $cookies: fragmentContent.$cookies || {},
        $model: fragmentContent.$model
      };

      Object.keys(gatewayContent.$headers).forEach(key => {
        try {
          res.set(key, gatewayContent.$headers[key]);
        } catch (e) {
          logger.error(`Invalid Header:${key}, fragment:${fragment.name}, value:${gatewayContent.$headers[key]}`);
        }
      });

      Object.keys(gatewayContent.$cookies).forEach(key => {
        res.cookie(key, gatewayContent.$cookies[key].value, gatewayContent.$cookies[key].options);
      });

      if (renderMode === FRAGMENT_RENDER_MODES.STREAM) {
        res.status(HTTP_STATUS_CODE.OK);
        res.json(gatewayContent.content);
      } else {
        if (gatewayContent.$status === HTTP_STATUS_CODE.MOVED_PERMANENTLY && gatewayContent.$headers && gatewayContent.$headers['location']) {
          res.status(gatewayContent.$status);
          res.end();
        } else {
          if (gatewayContent.content[partial]) {
            res.status(HTTP_STATUS_CODE.OK);
            res.send(this.wrapFragmentContent(gatewayContent.content[partial].toString(), fragment, version, gatewayContent.$model));
          } else {
            res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR);
            res.send(`Partial ${partial} doesn't exist in fragment response`);
          }
        }
      }
    } else {
      throw new Error(`Failed to find fragment: ${fragmentName}`);
    }
  }

  /**
   * Wraps with html template for preview mode
   * @param {string} htmlContent
   * @param {FragmentBFF} fragment
   * @param version
   * @param model
   * @returns {string}
   */
  private wrapFragmentContent(htmlContent: string, fragment: FragmentBFF, version: string, model: FragmentModel): string {
    const dom = cheerio.load(`<html><head><title>${this.config.name} - ${fragment.name}</title>${this.config.isMobile ? '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />' : ''}${Template.fragmentModelScript(fragment, model, false)}</head><body><div id="${fragment.name}">${htmlContent}</div></body></html>`);

    const fragmentVersion = fragment.config.versions[version];

    dom('head').prepend(ResourceInjector.wrapJsAsset({
      content: LIB_CONTENT,
      injectType: RESOURCE_INJECT_TYPE.INLINE,
      name: 'puzzle-lib',
      link: '',
      executeType: RESOURCE_JS_EXECUTE_TYPE.SYNC
    }));

    fragmentVersion.assets.forEach(asset => {
      if (asset.type === RESOURCE_TYPE.JS) {
        dom('body').append(`<script puzzle-asset="${asset.name}" src="/${fragment.name}/static/${asset.fileName}" type="text/javascript"${RESOURCE_JS_EXECUTE_TYPE.SYNC}></script>`);
      } else if (asset.type === RESOURCE_TYPE.CSS) {
        dom('head').append(`<link puzzle-asset="${asset.name}" rel="stylesheet" href="/${fragment.name}/static/${asset.fileName}" />`);
      }
    });

    fragmentVersion.dependencies.forEach(dependency => {
      if (dependency.type === RESOURCE_TYPE.JS) {
        dom('head').append(`<script puzzle-asset="${dependency.name}" src="${dependency.preview}" type="text/javascript"></script>`);
      } else if (dependency.type === RESOURCE_TYPE.CSS) {
        dom('head').append(`<link puzzle-asset="${dependency.name}" rel="stylesheet" href="${dependency.preview}" />`);
      }
    });

    return dom.html();
  }

  private detectVersion(fragment: FragmentBFF, cookie: ICookieMap, forcedVersion?: string): string {
    const cookieKey = fragment.config.testCookie;
    let cookieVersion;
    if (forcedVersion && fragment.config.versions[forcedVersion]) {
      cookieVersion = forcedVersion;
    } else if (cookie[cookieKey] && fragment.config.versions[cookie[cookieKey]]) {
      cookieVersion = cookie[cookieKey];
    }
    if (cookieVersion) return cookieVersion;

    const matcherVersion = fragment.versionMatcher ? fragment.versionMatcher.match(cookie) : null;
    if (matcherVersion && fragment.config.versions[matcherVersion]) return matcherVersion;

    return fragment.config.version;
  }

  /**
   * Adds fragment routes
   * @param {Function} cb
   */
  private addFragmentRoutes(cb: Function): void {
    this.config.fragments.forEach(fragmentConfig => {
      this.server.handler.addRoute(Array.isArray(fragmentConfig.render.url) ? fragmentConfig.render.url.map(url => `/${fragmentConfig.name}${url}`) : `/${fragmentConfig.name}${fragmentConfig.render.url}`, HTTP_METHODS.GET, async (req, res) => {
        const partial = req.query[PREVIEW_PARTIAL_QUERY_NAME] || DEFAULT_MAIN_PARTIAL;
        const renderMode = req.query[RENDER_MODE_QUERY_NAME] === FRAGMENT_RENDER_MODES.STREAM ? FRAGMENT_RENDER_MODES.STREAM : FRAGMENT_RENDER_MODES.PREVIEW;
        req.headers['originalurl'] = req.headers['originalurl'] || req.url.replace(`/${fragmentConfig.name}`, "");
        req.headers['originalpath'] = req.headers['originalpath'] || req.path.replace(`/${fragmentConfig.name}`, "");
        this.renderFragment(req, fragmentConfig.name, renderMode, partial, res, req.cookies, req.query[VERSION_QUERY_NAME]);
      }, this.getFragmentMiddlewares(fragmentConfig));
    });

    cb();
  }

  private getFragmentMiddlewares(fragmentConfig: IFragmentBFF) {
    const fragmentMiddlewares = fragmentConfig.render.middlewares || [];

    if (fragmentConfig.render.routeCache) {
      fragmentMiddlewares.unshift(routeCache.cacheSeconds(+fragmentConfig.render.routeCache));
    }

    return fragmentMiddlewares;
  }

  /**
   * Adds placeholder routes
   * @param {Function} cb
   */
  private addPlaceholderRoutes(cb: Function): void {
    this.config.fragments.forEach(fragment => {
      this.server.handler.addRoute(`/${fragment.name}/placeholder`, HTTP_METHODS.GET, async (req, res) => {
        if (req.query.delay && +req.query.delay) {
          res.set('content-type', 'text/html');
          const dom = cheerio.load(`<html><head><title>${this.config.name} - ${fragment.name}</title>${this.config.isMobile ? '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />' : ''}</head><body><div id="${fragment.name}">${this.fragments[fragment.name].placeholder(req, req.cookies[fragment.testCookie])}</div></body></html>`);
          res.write(dom.html());
          const gatewayContent = await this.fragments[fragment.name].render(req, req.cookies[fragment.testCookie]);
          res.write(`${CONTENT_REPLACE_SCRIPT}<div style="display: none;" id="${fragment.name}-replace">${gatewayContent[DEFAULT_MAIN_PARTIAL]}</div>`);
          setTimeout(() => {
            res.write(`<script>$p('#${fragment.name}', '#${fragment.name}-replace')</script>`);
            res.end();
          }, +req.query.delay);
        } else {
          res.send(this.fragments[fragment.name].placeholder(req, req.cookies[fragment.testCookie]));
        }
      });
    });

    cb();
  }

  /**
   *  Adds error routes
   *  @param { Function } cb
   */
  private addErrorPageRoutes(cb: Function): void {
    this.config.fragments.forEach((fragment) => {
      this.server.handler.addRoute(`/${fragment.name}/error`, HTTP_METHODS.GET, (req, res) => {
        res.send(this.fragments[fragment.name].errorPage(req, req.cookies[fragment.testCookie]));
      });
    });
    cb();
  }

  /**
   * Adds static routes
   * @param {Function} cb
   */
  private addStaticRoutes(cb: Function): void {
    Object.values(this.fragments).forEach(fragment => {
      const config = fragment.config;

      this.server.handler.addRoute(`/${fragment.name}/static/:staticName`, HTTP_METHODS.GET, (req, res, next) => {
        const targetVersion = req.query['__version'] || this.detectVersion(fragment, req.cookies);
        req.url = path.join('/', fragment.name, req.cookies[config.testCookie] || targetVersion, '/static/', req.params.staticName);
        next();
      });

      Object.keys(config.versions).forEach(version => {
        const staticPath = path.join(this.config.fragmentsFolder, config.name, version, '/assets');
        this.server.handler.setStatic(`/${config.name}/${version}/static/`, staticPath);
      });
    });

    cb();
  }

  /**
   * Adds healthcheck route
   * @param {Function} cb
   */
  private addHealthCheckRoutes(cb: Function) {
    this.server.handler.addRoute(HEALTHCHECK_PATHS, HTTP_METHODS.GET, (req, res) => {
      res.status(HTTP_STATUS_CODE.OK).end();
    });
    cb();
  }

  private addCorsPlugin(cb: Function) {
    this.server.handler.addUse(null, cors(
      {
        origin: this.config.corsDomains || ['*'],
        credentials: true,
        maxAge: this.config.corsMaxAge || undefined
      }
    ));

    cb();
  }

  /**
   * Adds expose configuration route
   * @param {Function} cb
   */
  private addConfigurationRoute(cb: Function) {
    this.server.handler.addRoute('/', HTTP_METHODS.GET, (req, res) => {

      if (req.query.fragment) {
        const fragment = this.exposedConfig.fragments[req.query.fragment];
        if (fragment) {
          return res.status(HTTP_STATUS_CODE.OK).json({
            assets: fragment.assets,
            dependencies: fragment.dependencies,
            version: fragment.version,
            passiveVersions: fragment.passiveVersions
          });
        }
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).end();
      }

      if (!this.config.authToken || req.header('x-authorization') === this.config.authToken) {
        res.status(HTTP_STATUS_CODE.OK).json(this.exposedConfig);
      } else {
        res.status(HTTP_STATUS_CODE.UNAUTHORIZED).end();
      }
    });

    cb();
  }

  /**
   * Adds custom headers
   * @param {Function} cb
   */

  private addCustomHeaders(cb: Function) {
    this.server.handler.addCustomHeaders(this.config.customHeaders);
    cb();
  }

  /**
   * Starts gateway and configures dependencies
   */
  private bootstrap() {
    this.exposedConfig = this.createExposeConfig();
    this.exposedConfig.hash = md5(JSON.stringify(this.exposedConfig));
  }

}
