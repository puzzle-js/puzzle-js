import {GatewayStorefrontInstance, IGatewayConfiguration, IGatewayMap} from "./gateway";
import {IPageConfiguration, Page} from "./page";
import {IPageMap} from "./page";
import {Server} from "./server";
import async from "async";
import {EVENTS, HTTP_METHODS} from "./enums";
import {wait} from "./util";
import {logger} from "./logger";

export interface IStorefrontConfig {
    gateways: IGatewayConfiguration[];
    port: number;
    pages: IPageConfiguration[];
    pollInterval?: number;
}

export class Storefront {
    server: Server = new Server();
    config: IStorefrontConfig;
    pages: IPageMap = {};
    gateways: IGatewayMap = {};
    private gatewaysReady = 0;

    /**
     * Start point for Storefront. Creates pages, gateways.
     * @param {IStorefrontConfig} storefrontConfig
     */
    constructor(storefrontConfig: IStorefrontConfig) {
        this.createStorefrontPagesAndGateways(storefrontConfig);

        this.config = storefrontConfig;
    }


    private createStorefrontPagesAndGateways(storefrontConfig: IStorefrontConfig) {
        storefrontConfig.gateways.forEach(gatewayConfiguration => {
            this.gateways[gatewayConfiguration.name] = new GatewayStorefrontInstance(gatewayConfiguration);

            this.gateways[gatewayConfiguration.name].events.once(EVENTS.GATEWAY_READY, () => {
                this.gatewaysReady++;
            });
        });

        storefrontConfig.pages.forEach(pageConfiguration => {
            this.pages[pageConfiguration.url] = new Page(pageConfiguration.html, this.gateways);
        });

        Object.values(this.gateways).forEach(gateway => {
            gateway.startUpdating();
        });
    }


    public init(cb?: Function) {
        async.series([
            async (cb: any) => {
                while (Object.keys(this.gateways).length != this.gatewaysReady) {
                    await wait(200);
                }

                cb();
            },
            this.addPageRoute.bind(this),
            this.addHealthCheckRoute.bind(this)
        ], err => {
            if (!err) {
                logger.info(`Storefront is listening on port ${this.config.port}`);
                this.server.listen(this.config.port, cb);
            } else {
                throw err;
            }
        });
    }

    private addHealthCheckRoute(cb: Function) {
        this.server.addRoute('/healthcheck', HTTP_METHODS.GET, (req, res) => {
            res.status(200).end();
        });

        cb();
    }

    private addPageRoute(cb: Function) {
        this.config.pages.forEach(page => {
            this.server.addRoute(page.url, HTTP_METHODS.GET, (req, res) => {
                this.pages[page.url].handle(req, res);
            });
        });

        cb();
    }
}
