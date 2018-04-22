import fetch from "node-fetch";
import {IExposeFragment, IFragmentStorefrontAttributes} from "../types/fragment";
import {IFragment, IFragmentBFF} from "../types/fragment";
import {FRAGMENT_RENDER_MODES} from "./enums";

export class Fragment {
    name: string;

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

    async render(req: object, version?: string) {
        const fragmentVersion = this.config.versions[version || this.config.version];
        if (fragmentVersion) {
            if (this.config.render.static) {
                return fragmentVersion.handler.content(req);
            } else {
                if (fragmentVersion.handler.data) {
                    const data = await fragmentVersion.handler.data(req);
                    return fragmentVersion.handler.content(req, data);
                } else {
                    throw new Error(`Failed to find data handler for fragment. Fragment: ${this.config.name}, Version: ${version || this.config.version}`);
                }
            }
        } else {
            throw new Error(`Failed to find fragment version. Fragment: ${this.config.name}, Version: ${version || this.config.version}`);
        }
    }
}

export class FragmentStorefront extends Fragment {
    config: IExposeFragment | undefined;
    attribs: IFragmentStorefrontAttributes;
    primary = false;
    shouldWait = false;
    private fragmentUrl: string | undefined;

    constructor(attribs: IFragmentStorefrontAttributes) {
        super({name: attribs.name});

        this.attribs = attribs;
    }

    update(config: IExposeFragment, gatewayUrl: string) {
        this.fragmentUrl = `${gatewayUrl}/${this.name}`;
        this.config = config;
    }

    async getPlaceholder() {
        if (!this.fragmentUrl || !this.config || !this.config.render.placeholder) return '';
        return fetch(`${this.fragmentUrl}/placeholder`)
            .then(res => res.text())
            .then(html => {
                return html;
            })
            .catch(err => {
                return '';
            });
    }

    async getContent(): Promise<{ [name: string]: string }> {
        if (!this.config) {
            console.error(`No config provided for fragment: ${this.name}`);
            return {};
        }
        return fetch(`${this.fragmentUrl}${this.config.render.url}?__renderMode=${FRAGMENT_RENDER_MODES.STREAM}`)
            .then(res => res.json())
            .then(fragmentStreamJson => {
                return fragmentStreamJson;
            })
            .catch(err => {
                console.error(err);
                return {};
            });
    }
}
