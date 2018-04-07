import {GatewayStorefrontInstance, IGatewayConfiguration, IGatewayMap} from "./gateway";
import {IPageConfiguration, IPageMap, Page} from "./page";

export interface IStorefrontConfig {
    gateways: Array<IGatewayConfiguration>;
    port: number;
    pages: Array<IPageConfiguration>;
}

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
