import {IGatewayConfiguration} from "./gateway";
import {IPageConfiguration} from "./page";
import {IFileResourceStorefrontDependency} from "./resourceFactory";

export interface IStorefrontConfig {
    gateways: IGatewayConfiguration[];
    port: number;
    pages: IPageConfiguration[];
    pollInterval?: number;
    dependencies: IFileResourceStorefrontDependency[];
}
