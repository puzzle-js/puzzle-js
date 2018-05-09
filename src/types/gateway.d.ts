import {IExposeFragment, IFragmentBFF} from "./fragment";
import {GatewayStorefrontInstance} from "../lib/gateway";
import {IApiConfig, IApiHandler} from "./api";

export interface IGatewayMap {
    [name: string]: GatewayStorefrontInstance;
}

export interface IGatewayConfiguration {
    name: string;
    url: string;
}

export interface IGatewayBFFConfiguration extends IGatewayConfiguration {
    fragments: IFragmentBFF[];
    api: IApiConfig[];
    port: number;
    isMobile?: boolean;
    fragmentsFolder: string;
}

export interface IExposeConfig {
    hash: string;
    fragments: {
        [name: string]: IExposeFragment
    };
}

