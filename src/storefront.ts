import {GatewayStorefrontInstance} from "./gatewayStorefront";
import {Page} from "./page";
import async from "async";
import {EVENTS, HEALTHCHECK_PATHS, HTTP_METHODS, HTTP_STATUS_CODE} from "./enums";
import {LIB_CONTENT, LIB_CONTENT_DEBUG, wait} from "./util";
import {Logger} from "./logger";
import {callableOnce, sealed} from "./decorators";
import {container, TYPES} from "./base";
import {Server} from "./network";
import {IGatewayConfiguration, IGatewayMap, IPageConfiguration, IStorefrontConfig} from "./types";
import ResourceFactory from "./resourceFactory";
import {GATEWAY_PREPERATION_CHECK_INTERVAL, PUZZLE_DEBUGGER_LINK, PUZZLE_LIB_LINK, TEMP_FOLDER} from "./config";
import {StorefrontConfigurator} from "./configurator";
import fs from "fs";
import {AssetManager} from "./asset-manager";
import {SentrySocket} from "./socket";
import {Template} from "./template";
import {SentryConnectorStorefront} from "./sentry-connector";

const logger = container.get(TYPES.Logger) as Logger;


@sealed
export class Storefront {
  server: Server;
  config: IStorefrontConfig;
  pages: Map<string, Page> = new Map();
  gateways: IGatewayMap = {};
  private gatewaysReady = 0;
  sentrySocket: SentrySocket;


  /**
   * Storefront Instance
   * @param {IStorefrontConfig} storefrontConfig
   * @param {Server} _server
   */
  constructor(
    storefrontConfig: IStorefrontConfig | StorefrontConfigurator,
    _server?: Server,
  ) {
    if (storefrontConfig instanceof StorefrontConfigurator) {
      this.config = storefrontConfig.configuration;
    } else {
      this.config = storefrontConfig;
    }
    this.sentrySocket = new SentrySocket();
    this.server = _server || new Server(this.config.serverOptions);
  }

  /**
   * Starts storefront instance
   * @param {Function} cb
   */
  @callableOnce
  init(cb?: Function) {
    this.sentrySocket.connect((sentryConnected: boolean) => {
      if (!sentryConnected) {
        console.log('Starting PuzzleJs storefront from source');
        this.start(cb);
      } else {
        SentryConnectorStorefront.loadFromSentry(this, () => {
          this.start(cb);
        });
      }
    });
  }

  private start(cb?: Function) {
    this.bootstrap();
    async.series([
      this.addPuzzleLibRoute.bind(this),
      this.registerDebugScripts.bind(this),
      this.registerDependencies.bind(this),
      this.waitForGateways.bind(this),
      this.addCustomHeaders.bind(this),
      this.addHealthCheckRoute.bind(this),
      this.preLoadPages.bind(this),
      this.addPageRoutes.bind(this)
    ], err => {
      if (!err) {
        this.server.listen(() => {
          logger.info(`Storefront is listening on port ${this.config.serverOptions.port}`);
          if (cb) cb();
        });
      } else {
        throw err;
      }
    });
  } 

  private addPuzzleLibRoute(cb: Function) {
    this.server.handler.addRoute(PUZZLE_LIB_LINK, HTTP_METHODS.GET, (req, res) => {
      res.set('Content-Type', 'application/javascript');
      res.send(LIB_CONTENT);
    });

    cb(null);
  }

  /**
   * Creates static routes for debugging scripts
   * @param {Function} cb
   * @returns {Promise<void>}
   */
  private async registerDebugScripts(cb: Function) {
    this.server.handler.addRoute(PUZZLE_DEBUGGER_LINK, HTTP_METHODS.GET, (req, res) => {
      res.set('Content-Type', 'application/javascript');
      res.send(LIB_CONTENT_DEBUG);
    });

    cb(null);
  }

  private preLoadPages(cb: Function) {
    Promise.all(Object.values(this.pages).map(async (page) => {
      logger.info(`Preloading page: ${page.name}`);
      await page.reCompile();
      logger.info(`Preloaded page: ${page.name}`);
    })).then(() => cb());
  }

  private bootstrap() {
    if (!fs.existsSync(TEMP_FOLDER)) {
      fs.mkdirSync(TEMP_FOLDER);
    }
    this.createStorefrontPagesAndGateways();
    AssetManager.init();
  }


  /**
   * Waits for gateways to be prepared
   * @param {Function} cb
   * @returns {Promise<void>}
   */
  private async waitForGateways(cb: Function) {
    while (Object.keys(this.gateways).length !== this.gatewaysReady) {
      await wait(GATEWAY_PREPERATION_CHECK_INTERVAL);
    }
    cb(null);
  }

  /**
   * Creates gateway pages, pages and subscribes event to gateways to track ready status
   */
  private createStorefrontPagesAndGateways() {
    this.config.gateways.forEach(gatewayConfiguration => {
      const gateway = new GatewayStorefrontInstance(gatewayConfiguration, this.config.authToken, this.config.satisfyUpdateCount);
      gateway.events.once(EVENTS.GATEWAY_READY, () => {
        this.gatewaysReady++;
      });
      gateway.startUpdating();
      this.gateways[gatewayConfiguration.name] = gateway;
    });

    this.config.pages.forEach(pageConfiguration => {
      this.pages.set(pageConfiguration.name, new Page(pageConfiguration.html, this.gateways, pageConfiguration.name, eval(pageConfiguration.condition as unknown as string), pageConfiguration.fragments));
    });
  }

  /**
   * Registers provided dependencies in storefront configuration
   * @param {Function} cb
   */
  private registerDependencies(cb: Function) {
    this.config.dependencies.forEach(dependency => {
      logger.info(`Registering Dependency: ${dependency.name}`);
      ResourceFactory.instance.registerDependencies(dependency);
    });

    cb();
  }

  /**
   * Adds healthcheck route.
   * @param {Function} cb
   */
  private addHealthCheckRoute(cb: Function) {
    logger.info(`Registering healthcheck routes: ${HEALTHCHECK_PATHS}`);
    this.server.handler.addRoute(HEALTHCHECK_PATHS, HTTP_METHODS.GET, (req, res) => {
      res.status(HTTP_STATUS_CODE.OK).end();
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

  addPage(page: IPageConfiguration) {
    logger.info(`Adding page ${page.name} route: ${page.url}`);

    let parsedUrl;

    try {
      parsedUrl = JSON.parse(page.url as any);
    } catch (e) {
      parsedUrl = page.url;
    }

    this.server.handler.addRoute(parsedUrl, HTTP_METHODS.GET, (req, res, next) => {
      const currentPage = this.pages.get(page.name);
      if (currentPage) {
        logger.info(`Request route name: ${page.name} - ${req.url} - ${JSON.stringify(req.headers)}`);
        if (typeof currentPage.condition === 'function' ? currentPage.condition(req) : true) {
          currentPage.handle(req, res);
        } else {
          next();
        }
      } else {
        next();
      }
    });


    this.server.handler.addRoute(parsedUrl, HTTP_METHODS.POST, (req, res, next) => {
      const currentPage = this.pages.get(page.name);
      if (currentPage) {
        currentPage.post(req, res, next);
      } else {
        next();
      }
    });
  }

  /**
   * Adds page routes then connects with page instance responsible for it.
   * @param {Function} cb
   */
  private addPageRoutes(cb: Function) {
    this.config.pages.forEach(pageConfiguration => {
      this.addPage(pageConfiguration);
    });

    cb();
  }
}
