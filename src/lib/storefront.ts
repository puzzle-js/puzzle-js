import {GatewayStorefrontInstance} from "./gateway";
import {Page} from "./page";
import {IGatewayMap} from "../types/gateway";
import {IPageMap} from "../types/page";
import {IStorefrontConfig} from "../types/storefront";

export class Storefront {
    public pages: IPageMap = {};
    public gateways: IGatewayMap = {};

    constructor(storefrontConfig: IStorefrontConfig) {
        storefrontConfig.gateways.forEach(gatewayConfiguration => {
            this.gateways[gatewayConfiguration.name] = new GatewayStorefrontInstance(gatewayConfiguration);
        });

        storefrontConfig.pages.forEach(pageConfiguration => {
            this.pages[pageConfiguration.url] = new Page(pageConfiguration.html, this.gateways);
        });
    }
}
