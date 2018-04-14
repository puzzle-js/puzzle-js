import {IExposeFragment, IFragmentBFF} from "./fragment";
import {GatewayStorefrontInstance} from "../lib/gateway";

export interface IGatewayMap {
    [name: string]: GatewayStorefrontInstance;
}

export interface IGatewayConfiguration {
    name: string;
    url: string;
}

export interface IGatewayBFFConfiguration extends IGatewayConfiguration {
    fragments: Array<IFragmentBFF>;
    api: Array<any>;
    port: number;
    isMobile?: boolean;
}

export interface IExposeConfig {
    hash: string;
    fragments: {
        [name: string]: IExposeFragment
    }
}

