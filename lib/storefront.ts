import {GatewayConfiguration} from "./gateway";
import {Page, PageConfiguration} from "./page";

export interface StorefrontConfig {
    gateways: Array<GatewayConfiguration>,
    port: number,
    pages: Array<PageConfiguration>
}

export interface PageMap {
    [url: string]: Page
}

export class Storefront {
    public pages: PageMap = {};

    constructor(storefrontConfig: StorefrontConfig) {
        storefrontConfig.pages.forEach(pageConfiguration => {
           this.pages[pageConfiguration.url] = new Page(pageConfiguration.html);
        });
    }
}
