import {IFragmentBFF, IFragmentBFFRender} from "./fragment";
import {IFileResourceAsset} from "./resource";
import {GatewayStorefrontInstance} from "../lib/gateway";
import {IFileResourceDependency} from "./resource";

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

export interface IExposeFragment {
    version: string;
    render: IFragmentBFFRender;
    assets: Array<IFileResourceAsset>;
    dependencies: Array<IFileResourceDependency>;
}