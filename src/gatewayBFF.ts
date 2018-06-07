import {FragmentBFF} from "./fragment";
import {Api} from "./api";
import {logger} from "./logger";
import {
    CONTENT_REPLACE_SCRIPT,
    DEFAULT_MAIN_PARTIAL,
    FRAGMENT_RENDER_MODES,
    HTTP_METHODS, HTTP_STATUS_CODE,
    RESOURCE_LOCATION,
    RESOURCE_TYPE
} from "./enums";
import {PREVIEW_PARTIAL_QUERY_NAME, RENDER_MODE_QUERY_NAME} from "./config";
import {IExposeConfig, IFragmentResponse} from "./types";
import md5 from "md5";
import async from "async";
import path from "path";
import express from "express";
import {Server} from "./server";
import {container, TYPES} from "./base";
import cheerio from "cheerio";
import {IExposeFragment, IGatewayBFFConfiguration} from "./types";
import {callableOnce, sealed} from "./decorators";
import {GatewayConfigurator} from "./configurator";

@sealed
export class GatewayBFF {
    exposedConfig: IExposeConfig;
    server: Server;
    name: string;
    url: string;
    private config: IGatewayBFFConfiguration;
    private fragments: { [name: string]: FragmentBFF } = {};
    private apis: { [name: string]: Api } = {};

    /**
     * Gateway constructor
     * @param {IGatewayBFFConfiguration} gatewayConfig
     * @param {Server} _server
     */
    constructor(gatewayConfig: IGatewayBFFConfiguration | GatewayConfigurator, _server?: Server) {
        this.server = _server || container.get(TYPES.Server);

        if (gatewayConfig.hasOwnProperty('configuration')) {
            const configurator = gatewayConfig as GatewayConfigurator;
            this.config = configurator.configuration;
            this.name = configurator.configuration.name;
            this.url = configurator.configuration.url;
        } else {
            const config = gatewayConfig as IGatewayBFFConfiguration;
            this.config = config;
            this.name = config.name;
            this.url = config.url;
        }

        this.exposedConfig = this.createExposeConfig();
        this.exposedConfig.hash = md5(JSON.stringify(this.exposedConfig));
    }


    /**
     * Starts gateway
     */
    @callableOnce
    public init(cb?: Function) {
        async.series([
            this.addPlaceholderRoutes.bind(this),
            this.addApiRoutes.bind(this),
            this.addStaticRoutes.bind(this),
            this.addFragmentRoutes.bind(this),
            this.addConfigurationRoute.bind(this),
            this.addHealthCheckRoute.bind(this)
        ], err => {
            if (!err) {
                logger.info(`Gateway is listening on port ${this.config.port}`);
                this.server.listen(this.config.port, cb);
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
                //todo test cookieler calismiyor, versiyonlara gore build edilmeli asset ve dependency configleri
                fragmentList[fragment.name] = {
                    version: fragment.version,
                    render: fragment.render,
                    assets: fragment.versions[fragment.version].assets,
                    dependencies: fragment.versions[fragment.version].dependencies,
                    testCookie: fragment.testCookie,
                };

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
     * @param {string} cookieValue
     * @returns {Promise<IFragmentResponse>}
     */
    async renderFragment(req: any, fragmentName: string, renderMode: FRAGMENT_RENDER_MODES = FRAGMENT_RENDER_MODES.PREVIEW, partial: string, res: any, cookieValue?: string): Promise<IFragmentResponse> {
        if (this.fragments[fragmentName]) {
            const fragmentContent = await this.fragments[fragmentName].render(req, res, cookieValue);
            switch (renderMode) {
                case FRAGMENT_RENDER_MODES.STREAM:
                    return {
                        content: JSON.stringify(fragmentContent),
                        $status: +(fragmentContent.$status || HTTP_STATUS_CODE.OK),
                        $headers: fragmentContent.$headers || {},
                        $model: fragmentContent.$model || {}
                    };
                case FRAGMENT_RENDER_MODES.PREVIEW:
                    return {
                        content: fragmentContent[partial] ? this.wrapFragmentContent(fragmentContent[partial].toString(), this.fragments[fragmentName], cookieValue) : '',
                        $status: +(fragmentContent.$status || HTTP_STATUS_CODE.OK),
                        $headers: fragmentContent.$headers || {},
                        $model: fragmentContent.$model || {}
                    };
                default:
                    return {
                        content: JSON.stringify(fragmentContent),
                        $status: +(fragmentContent.$status || HTTP_STATUS_CODE.OK),
                        $headers: fragmentContent.$headers || {},
                        $model: fragmentContent.$model || {}
                    };
            }
        } else {
            throw new Error(`Failed to find fragment: ${fragmentName}`);
        }
    }

    /**
     * Wraps with html template for preview mode
     * @param {string} htmlContent
     * @param {FragmentBFF} fragment
     * @param {string | undefined} cookieValue
     * @returns {string}
     */
    private wrapFragmentContent(htmlContent: string, fragment: FragmentBFF, cookieValue: string | undefined): string {
        const dom = cheerio.load(`<html><head><title>${this.config.name} - ${fragment.name}</title>${this.config.isMobile ? '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />' : ''}</head><body><div id="${fragment.name}">${htmlContent}</div></body></html>`);

        const fragmentVersion = cookieValue && fragment.config.versions[cookieValue] ? fragment.config.versions[cookieValue] : fragment.config.versions[fragment.config.version];

        fragmentVersion.assets.forEach(asset => {
            if (asset.type === RESOURCE_TYPE.JS) {
                switch (asset.location) {
                    case RESOURCE_LOCATION.HEAD:
                        dom('head').append(`<script puzzle-asset="${asset.name}" src="/${fragment.name}/static/${asset.fileName}" type="text/javascript"></script>`);
                        break;
                    case RESOURCE_LOCATION.CONTENT_START:
                        dom('body').prepend(`<script puzzle-asset="${asset.name}" src="/${fragment.name}/static/${asset.fileName}" type="text/javascript"></script>`);
                        break;
                    case RESOURCE_LOCATION.BODY_START:
                        dom('body').prepend(`<script puzzle-asset="${asset.name}" src="/${fragment.name}/static/${asset.fileName}" type="text/javascript"></script>`);
                        break;
                    case RESOURCE_LOCATION.CONTENT_END:
                        dom('body').append(`<script puzzle-asset="${asset.name}" src="/${fragment.name}/static/${asset.fileName}" type="text/javascript"></script>`);
                        break;
                    case RESOURCE_LOCATION.BODY_END:
                        dom('body').append(`<script puzzle-asset="${asset.name}" src="/${fragment.name}/static/${asset.fileName}" type="text/javascript"></script>`);
                        break;
                }
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

    /**
     * Adds fragment routes
     * @param {Function} cb
     */
    private addFragmentRoutes(cb: Function): void {
        this.config.fragments.forEach(fragmentConfig => {
            this.server.addRoute(`/${fragmentConfig.name}${fragmentConfig.render.url}`, HTTP_METHODS.GET, async (req, res) => {
                const renderMode = req.query[RENDER_MODE_QUERY_NAME] === FRAGMENT_RENDER_MODES.STREAM ? FRAGMENT_RENDER_MODES.STREAM : FRAGMENT_RENDER_MODES.PREVIEW;
                const gatewayContent = await this.renderFragment(req, fragmentConfig.name, renderMode, req.query[PREVIEW_PARTIAL_QUERY_NAME] || DEFAULT_MAIN_PARTIAL, res, req.cookies[fragmentConfig.testCookie]);
                if (renderMode === FRAGMENT_RENDER_MODES.STREAM) {
                    res.set('content-type', 'application/json');
                    for (let prop in gatewayContent.$headers) {
                        res.set(prop, gatewayContent.$headers[prop]);
                    }
                    res.status(HTTP_STATUS_CODE.OK).end(gatewayContent.content);
                } else {
                    for (let prop in gatewayContent.$headers) {
                        res.set(prop, gatewayContent.$headers[prop]);
                    }
                    res.status(HTTP_STATUS_CODE.OK).send(gatewayContent.content);
                }
            }, fragmentConfig.render.middlewares);
        });

        cb();
    }

    /**
     * Adds placeholder routes
     * @param {Function} cb
     */
    private addPlaceholderRoutes(cb: Function): void {
        this.config.fragments.forEach(fragment => {
            this.server.addRoute(`/${fragment.name}/placeholder`, HTTP_METHODS.GET, async (req, res, next) => {
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
     * Adds static routes
     * @param {Function} cb
     */
    private addStaticRoutes(cb: Function): void {
        this.config.fragments.forEach(fragment => {
            this.server.addRoute(`/${fragment.name}/static/:staticName`, HTTP_METHODS.GET, (req, res, next) => {
                req.url = path.join('/', fragment.name, req.cookies[fragment.testCookie] || fragment.version, '/static/', req.params.staticName);
                next();
            });

            Object.keys(fragment.versions).forEach(version => {
                const staticPath = path.join(this.config.fragmentsFolder, fragment.name, version, '/assets');
                this.server.addUse(`/${fragment.name}/${version}/static/`, express.static(staticPath));
            });
        });

        cb();
    }

    /**
     * Adds healthcheck route
     * @param {Function} cb
     */
    private addHealthCheckRoute(cb: Function) {
        this.server.addRoute('/healthcheck', HTTP_METHODS.GET, (req, res) => {
            res.status(200).end();
        });

        cb();
    }

    /**
     * Adds expose configuration route
     * @param {Function} cb
     */
    private addConfigurationRoute(cb: Function) {
        this.server.addRoute('/', HTTP_METHODS.GET, (req, res) => {
            res.status(200).json(this.exposedConfig);
        });

        cb();
    }
}
