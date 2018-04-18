import fetch from "node-fetch";
import {IExposeFragment} from "../types/fragment";
import {IFragment, IFragmentBFF} from "../types/fragment";

export class Fragment {
    public name: string;

    constructor(config: IFragment) {
        this.name = config.name;
    }
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
                if (fragmentVersion.handler.data) {
                    const data = await fragmentVersion.handler.data(req);
                    return fragmentVersion.handler.content(req, data);
                } else {
                    throw new Error(`Failed to find data handler for fragment. Fragment: ${this.config.name}, Version: ${version || this.config.version}`)
                }
            }
        } else {
            throw new Error(`Failed to find fragment version. Fragment: ${this.config.name}, Version: ${version || this.config.version}`);
        }
    }
}

export class FragmentStorefront extends Fragment {
    public config: IExposeFragment | undefined;
    public primary: boolean;
    private gatewayUrl: string | undefined;

    constructor(name: string, primary: boolean = false) {
        super({name});

        this.primary = primary;
    }

    public update(config: IExposeFragment, gatewayUrl: string){
        this.gatewayUrl = gatewayUrl;
        this.config = config;
    }

    public async getPlaceholder(){

    }
}
