import {Page} from "../lib/page";
import {GatewayStorefrontInstance} from "../lib/gateway";
import {FragmentStorefront} from "../lib/fragment";

export interface IPageConfiguration {
    html: string;
    url: string;
}

export interface IPageMap {
    [url: string]: Page;
}

export interface IPageDependentGateways {
    gateways: {
        [name: string]: {
            gateway: GatewayStorefrontInstance | null,
            ready: boolean
        }
    },
    fragments: {
        [name: string]: {
            instance: FragmentStorefront,
            gateway: string
        }
    }
}

export interface IResponseHandlers {
    [versionsHash: string]: (req: object, res: object) => void;
}

export interface IfragmentCookieMap {
    name: string;
    live: string;
}
