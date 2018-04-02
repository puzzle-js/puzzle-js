import {IFileResourceAsset, IFileResourceDependency} from "./resource";
import Module = NodeJS.Module;

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
    name: string;
    versions: { [version: string]: IFragmentBFFVersion };
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

export enum FRAGMENT_RENDER_MODES {
    PREVIEW,
    STREAM
}

export class FragmentBFF extends Fragment {
    private config: IFragmentBFF;

    constructor(config: IFragmentBFF) {
        super({name: config.name});
        this.config = config;
    }

    public async render(req: object, version?: string) {
        const fragmentVersion = this.config.versions[version || this.config.version];
        if (fragmentVersion) {
            if (this.config.render.static) {
                return fragmentVersion.handler.content(req);
            } else {
                if(fragmentVersion.handler.data){
                    const data = await fragmentVersion.handler.data(req);
                    return fragmentVersion.handler.content(req, data);
                }else{
                    throw new Error(`Failed to find data handler for fragment. Fragment: ${this.config.name}, Version: ${version || this.config.version}`)
                }
            }
        } else {
            throw new Error(`Failed to find fragment version. Fragment: ${this.config.name}, Version: ${version || this.config.version}`);
        }
    }
}
