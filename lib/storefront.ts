import {GatewayConfiguration, GatewayStorefrontInstance} from "./gateway";
import {Page, IPageConfiguration} from "./page";
import {EventEmitter} from "events";


export interface StorefrontConfig {
    gateways: Array<GatewayConfiguration>;
    port: number;
    pages: Array<IPageConfiguration>;
}

export interface PageMap {
    [url: string]: Page;
}

export interface GatewayMap {
    [name: string]: GatewayStorefrontInstance;
}

export class Storefront {
    public pages: PageMap = {};
    public gateways: GatewayMap = {};
    public eventBus: EventEmitter = new EventEmitter();

    constructor(storefrontConfig: StorefrontConfig) {
        storefrontConfig.pages.forEach(pageConfiguration => {
            this.pages[pageConfiguration.url] = new Page(pageConfiguration.html, this.eventBus);
        });

        storefrontConfig.gateways.forEach(gatewayConfiguration => {
            this.gateways[gatewayConfiguration.name] = new GatewayStorefrontInstance(gatewayConfiguration, this.eventBus);
        });
    }


}
