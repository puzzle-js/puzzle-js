import fetch from "node-fetch";
import {IExposeFragment, IfragmentContentResponse, IFragmentStorefrontAttributes} from "../types/fragment";
import {IFragment, IFragmentBFF} from "../types/fragment";
import {FRAGMENT_RENDER_MODES} from "./enums";
import * as querystring from "querystring";

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
    primary = false;
    shouldWait = false;
    from: string;
    private fragmentUrl: string | undefined;

    constructor(name: string, from: string) {
        super({name});

        this.from = from;
    }

    update(config: IExposeFragment, gatewayUrl: string) {
        this.fragmentUrl = `${gatewayUrl}/${this.name}`;
        this.config = config;
    }

    async getPlaceholder() {
        if (!this.fragmentUrl || !this.config || !this.config.render.placeholder) {
            console.error('No render, or placeholder enabled');
            return '';
        }
        return fetch(`${this.fragmentUrl}/placeholder`)
            .then(res => res.text())
            .then(html => {
                return html;
            })
            .catch(err => {
                return '';
            });
    }

    async getContent(attribs: any = {}): Promise<IfragmentContentResponse> {
        if (!this.config) {
            //todo error handling
            console.error(`No config provided for fragment: ${this.name}`);
            return {
                status: 500,
                html: {}
            };
        }

        const query = {
            ...attribs,
            __renderMode: FRAGMENT_RENDER_MODES.STREAM
        };

        delete query.from;
        delete query.name;
        delete query.partial;
        delete query.primary;
        delete query.shouldwait;

        return fetch(`${this.fragmentUrl}${this.config.render.url}?${querystring.stringify(query)}`)
            .then(async res => {
                return {
                    status: res.status,
                    html: await res.json()
                };
            })
            .catch(err => {
                //todo error handling
                //console.error(err);
                return {
                    status: 500,
                    html: {}
                };
            });
    }
}
