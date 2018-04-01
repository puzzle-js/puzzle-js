import {IGatewayConfiguration, GatewayStorefrontInstance} from "./gateway";
import {Page, IPageConfiguration} from "./page";
import {EventEmitter} from "events";

export interface IStorefrontConfig {
    gateways: Array<IGatewayConfiguration>;
    port: number;
    pages: Array<IPageConfiguration>;
}

export interface IPageMap {
    [url: string]: Page;
}

export interface IGatewayMap {
    [name: string]: GatewayStorefrontInstance;
}

export class Storefront {
    public pages: IPageMap = {};
    public gateways: IGatewayMap = {};
    public eventBus: EventEmitter = new EventEmitter();

    constructor(storefrontConfig: IStorefrontConfig) {
        storefrontConfig.pages.forEach(pageConfiguration => {
            this.pages[pageConfiguration.url] = new Page(pageConfiguration.html, this.eventBus);
        });

        storefrontConfig.gateways.forEach(gatewayConfiguration => {
            this.gateways[gatewayConfiguration.name] = new GatewayStorefrontInstance(gatewayConfiguration, this.eventBus);
        });
    }
}
