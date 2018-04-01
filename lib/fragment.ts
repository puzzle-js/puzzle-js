import {IFileResourceAsset, IFileResourceDependency} from "./resource";
import Module = NodeJS.Module;

export interface IFragment {
    name: string;
}

export interface IFragmentBFFRender {
    url: string;
    routeCache?: number;
    selfReplace?: boolean;
    middlewares?: [Array<Function>];
    cacheControl?: string;
    placeholder?: boolean;
}

export interface IFragmentHandler {
    content: () => string;
    placeholder?: () => string;
    data?: () => any;
}

export interface IFragmentBFFVersion {
    assets: Array<IFileResourceAsset>;
    dependencies: Array<IFileResourceDependency>;
    handler: IFragmentHandler;
}

export interface IFragmentBFF extends IFragment{
    versions: {[version: string]: IFragmentBFFVersion};
    version: string;
    render: IFragmentBFFRender;
}

export interface IFragmentMap {
    [name: string]: Fragment;
}

export class Fragment {
    public name: string;

    constructor(config: IFragment) {
        this.name = config.name;
    }
}
