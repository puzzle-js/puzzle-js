import {IFileResourceAsset, IFileResourceDependency} from "./resource";
import {Fragment} from "../lib/fragment";

export interface IFragment {
    name: string;
}

export interface IFragmentBFFRender {
    static?: boolean;
    url: string;
    routeCache?: number;
    selfReplace?: boolean;
    middlewares?: [Array<Function>];
    cacheControl?: string;
    placeholder?: boolean;
}

export interface IFragmentHandler {
    content: (req: object, data?: any) => string;
    placeholder: () => string;
    data: (req: object) => any;
}

export interface IFragmentBFFVersion {
    assets: Array<IFileResourceAsset>;
    dependencies: Array<IFileResourceDependency>;
    handler: IFragmentHandler;
}

export interface IFragmentBFF extends IFragment {
    versions: {
        [version: string]: IFragmentBFFVersion
    };
    version: string;
    testCookie: string;
    render: IFragmentBFFRender;
}

export interface IFragmentMap {
    [name: string]: Fragment;
}

export interface IExposeFragment {
    version: string;
    testCookie: string;
    render: IFragmentBFFRender;
    assets: Array<IFileResourceAsset>;
    dependencies: Array<IFileResourceDependency>;
}
