import {IGatewayConfiguration} from "./gateway";
import {IPageConfiguration} from "./page";

export interface IStorefrontConfig {
    gateways: Array<IGatewayConfiguration>;
    port: number;
    pages: Array<IPageConfiguration>;
}