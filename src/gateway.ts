import md5 from "md5";
import {EventEmitter} from "events";
import {FragmentBFF, IFragmentBFF, IFragmentBFFRender} from "./fragment";
import {
    DEFAULT_MAIN_PARTIAL,
    EVENTS,
    FRAGMENT_RENDER_MODES,
    HTTP_METHODS,
    RESOURCE_LOCATION,
    RESOURCE_TYPE
} from "./enums";
import fetch from "node-fetch";
import {DEFAULT_POLLING_INTERVAL, PREVIEW_PARTIAL_QUERY_NAME, RENDER_MODE_QUERY_NAME} from "./config";
import async from "async";
import {Server} from "./server";
import * as path from "path";
import express from "express";
import {Api, IApiConfig} from "./api";
import cheerio from "cheerio";
import {IFileResourceAsset, IFileResourceDependency} from "./resourceFactory";
import Timer = NodeJS.Timer;
import {logger} from "./logger";

export interface IExposeFragment {
    version: string;
    testCookie: string;
    render: IFragmentBFFRender;
    assets: IFileResourceAsset[];
    dependencies: IFileResourceDependency[];
}

export interface IGatewayMap {
    [name: string]: GatewayStorefrontInstance;
}

export interface IGatewayConfiguration {
    name: string;
    url: string;
}

export interface IGatewayBFFConfiguration extends IGatewayConfiguration {
    fragments: IFragmentBFF[];
    api: IApiConfig[];
    port: number;
    isMobile?: boolean;
    fragmentsFolder: string;
}

export interface IExposeConfig {
    hash: string;
    fragments: {
        [name: string]: IExposeFragment
    };
}

export class Gateway {
    name: string;
    url: string;


    constructor(gatewayConfig: IGatewayConfiguration) {
        this.name = gatewayConfig.name;
        this.url = gatewayConfig.url;
    }
}

export class GatewayStorefrontInstance extends Gateway {
    events: EventEmitter = new EventEmitter();
    config: IExposeConfig | undefined;
    private intervalId: Timer | null | number = null;

    constructor(gatewayConfig: IGatewayConfiguration) {
        super(gatewayConfig);

        this.fetch();
    }

    /**
     * Starts updating gateway by polling with the provided miliseconds
     * @param {number} pollingInterval
     */
    startUpdating(pollingInterval: number = DEFAULT_POLLING_INTERVAL) {
        this.intervalId = setInterval(this.fetch.bind(this), pollingInterval);
    }

    /**
     * Stops udpating gateway
     */
    stopUpdating() {
        if (this.intervalId) {
            clearInterval(this.intervalId as Timer);
        }
    }

    /**
     * Fetches gateway condifuration and calls this.bind
     */
    private fetch() {
        fetch(this.url)
            .then(res => res.json())
            .then(this.update.bind(this))
            .catch(e => {
                console.error(`Failed to fetch gateway configuration: ${this.name}`);
                //todo error handling
                //console.error(e)
            });
    }

    /**
     * Updates gateway configuration and if hash changed emits GATEWAY_UPDATED event
     * @param {IExposeConfig} data
     */
    private update(data: IExposeConfig) {
        if (!this.config) {
            logger.info(`Gateway is ready: ${this.name}`);
            this.config = data;
            this.events.emit(EVENTS.GATEWAY_READY, this);
        } else {
            if (data.hash !== this.config.hash) {
                logger.info(`Gateway is updated: ${this.name}`);
                this.config = data;
                this.events.emit(EVENTS.GATEWAY_UPDATED, this);
            }
        }
    }
}

export class GatewayBFF extends Gateway {
    exposedConfig: IExposeConfig;
    server: Server = new Server();
    private config: IGatewayBFFConfiguration;
    private fragments: { [name: string]: FragmentBFF } = {};
    private apis: { [name: string]: Api } = {};


    constructor(gatewayConfig: IGatewayBFFConfiguration) {
        super(gatewayConfig);
        this.config = gatewayConfig;
        this.exposedConfig = this.createExposeConfig();
        this.exposedConfig.hash = md5(JSON.stringify(this.exposedConfig));
    }

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

    private addApiRoutes(cb: Function) {
        this.config.api.forEach(apiConfig => {
            this.apis[apiConfig.name] = new Api(apiConfig);
            this.apis[apiConfig.name].registerEndpoints(this.server);
        });
        cb();
    }

    private createExposeConfig() {
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
     * @param {string} fragmentName
     * @param {FRAGMENT_RENDER_MODES} renderMode
     * @param {string} cookieValue
     * @returns {Promise<string>}
     */
    async renderFragment(fragmentName: string, renderMode: FRAGMENT_RENDER_MODES = FRAGMENT_RENDER_MODES.PREVIEW, partial: string, cookieValue?: string): Promise<string> {
        if (this.fragments[fragmentName]) {
            const fragmentContent = await this.fragments[fragmentName].render({}, cookieValue);
            switch (renderMode) {
                case FRAGMENT_RENDER_MODES.STREAM:
                    return JSON.stringify(fragmentContent);
                case FRAGMENT_RENDER_MODES.PREVIEW:
                    return this.wrapFragmentContent(fragmentContent[partial], this.fragments[fragmentName], cookieValue);
                default:
                    return JSON.stringify(fragmentContent);
            }
        } else {
            throw new Error(`Failed to find fragment: ${fragmentName}`);
        }
    }

    /**
     * Wraps with html template for preview mode
     * @param {string} htmlContent
     * @param {string} fragmentName
     * @returns {string}
     */
    private wrapFragmentContent(htmlContent: string, fragment: FragmentBFF, cookieValue: string | undefined) {
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

        return dom.html();
    }

    private addFragmentRoutes(cb: Function) {
        this.config.fragments.forEach(fragmentConfig => {
            this.server.addRoute(`/${fragmentConfig.name}${fragmentConfig.render.url}`, HTTP_METHODS.GET, async (req, res) => {
                const renderMode = req.query[RENDER_MODE_QUERY_NAME] === FRAGMENT_RENDER_MODES.STREAM ? FRAGMENT_RENDER_MODES.STREAM : FRAGMENT_RENDER_MODES.PREVIEW;
                const gatewayContent = await this.renderFragment(fragmentConfig.name, renderMode, req.query[PREVIEW_PARTIAL_QUERY_NAME] || DEFAULT_MAIN_PARTIAL, req.cookies[fragmentConfig.testCookie]);
                //todo gatewayden donen headera gore yonelndirme yapilmasi gerekiyor yani res bilmesi gerekiyor gateway yazanin cozum bul
                if (renderMode === FRAGMENT_RENDER_MODES.STREAM) {
                    res.set('content-type', 'application/json');
                    res.status(200).end(gatewayContent);
                } else {
                    res.status(200).send(gatewayContent);
                }
            });
        });

        cb();
    }

    private addPlaceholderRoutes(cb: Function) {
        this.config.fragments.forEach(fragment => {
            this.server.addRoute(`/${fragment.name}/placeholder`, HTTP_METHODS.GET, (req, res, next) => {
                res.end(this.fragments[fragment.name].placeholder(req, req.cookies[fragment.testCookie]));
            });
        });

        cb();
    }

    private addStaticRoutes(cb: Function) {
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

    private addHealthCheckRoute(cb: Function) {
        this.server.addRoute('/healthcheck', HTTP_METHODS.GET, (req, res) => {
            res.status(200).end();
        });

        cb();
    }

    private addConfigurationRoute(cb: Function) {
        this.server.addRoute('/', HTTP_METHODS.GET, (req, res) => {
            res.status(200).json(this.exposedConfig);
        });

        cb();
    }
}

