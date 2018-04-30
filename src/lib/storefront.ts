import {GatewayStorefrontInstance} from "./gateway";
import {Page} from "./page";
import {IGatewayMap} from "../types/gateway";
import {IPageMap} from "../types/page";
import {IStorefrontConfig} from "../types/storefront";

export class Storefront {
    pages: IPageMap = {};
    gateways: IGatewayMap = {};

    /**
     * Start point for Storefront. Creates pages, gateways.
     * @param {IStorefrontConfig} storefrontConfig
     */
    constructor(storefrontConfig: IStorefrontConfig) {
        storefrontConfig.gateways.forEach(gatewayConfiguration => {
            this.gateways[gatewayConfiguration.name] = new GatewayStorefrontInstance(gatewayConfiguration);
            this.gateways[gatewayConfiguration.name].startUpdating();
        });

        storefrontConfig.pages.forEach(pageConfiguration => {
            this.pages[pageConfiguration.url] = new Page(pageConfiguration.html, this.gateways);
        });
    }
}
