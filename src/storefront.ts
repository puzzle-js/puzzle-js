import {GatewayStorefrontInstance, IGatewayConfiguration, IGatewayMap} from "./gateway";
import {IPageConfiguration, Page} from "./page";
import {IPageMap} from "./page";

export interface IStorefrontConfig {
    gateways: IGatewayConfiguration[];
    port: number;
    pages: IPageConfiguration[];
    pollInterval?: number;
}

export class Storefront {
    pages: IPageMap = {};
    gateways: IGatewayMap = {};

    /**
     * Start point for Storefront. Creates pages, gateways.
     * @param {IStorefrontConfig} storefrontConfig
     */
    constructor(storefrontConfig: IStorefrontConfig) {
        this.createStorefrontPagesandGateways(storefrontConfig);
    }


    private createStorefrontPagesandGateways(storefrontConfig: IStorefrontConfig) {
        storefrontConfig.gateways.forEach(gatewayConfiguration => {
            this.gateways[gatewayConfiguration.name] = new GatewayStorefrontInstance(gatewayConfiguration);
            this.gateways[gatewayConfiguration.name].startUpdating();
        });

        storefrontConfig.pages.forEach(pageConfiguration => {
            this.pages[pageConfiguration.url] = new Page(pageConfiguration.html, this.gateways);
        });
    }
}
