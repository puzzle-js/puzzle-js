import {IGatewayConfiguration} from "./gateway";
import {IPageConfiguration} from "./page";

export interface IStorefrontConfig {
    gateways: IGatewayConfiguration[];
    port: number;
    pages: IPageConfiguration[];
    pollInterval?: number;
}
