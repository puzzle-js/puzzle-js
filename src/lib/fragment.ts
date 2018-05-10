import fetch from "node-fetch";
import {IExposeFragment, IfragmentContentResponse, IFragmentStorefrontAttributes} from "../types/fragment";
import {IFragment, IFragmentBFF} from "../types/fragment";
import {FRAGMENT_RENDER_MODES} from "./enums";
import * as querystring from "querystring";
import {DEFAULT_CONTENT_TIMEOUT} from "./config";


export class Fragment {
    name: string;

    constructor(config: IFragment) {
        this.name = config.name;
    }
}

export class FragmentBFF extends Fragment {
    public config: IFragmentBFF;

    constructor(config: IFragmentBFF) {
        super({name: config.name});
        this.config = config;
    }

    /**
     * Renders fragment: data -> content
     * @param {object} req
     * @param {string} version
     * @returns {Promise<{main: string; [p: string]: string}>}
     */
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

    placeholder(req: object, version?: string) {
        const fragmentVersion = version && this.config.versions[version] ? this.config.versions[version] : this.config.versions[this.config.version];
        if (fragmentVersion) {
            return fragmentVersion.handler.placeholder();
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
    public fragmentUrl: string | undefined;

    constructor(name: string, from: string) {
        super({name});

        this.from = from;
    }

    /**
     * Updates fragment configuration
     * @param {IExposeFragment} config
     * @param {string} gatewayUrl
     */
    update(config: IExposeFragment, gatewayUrl: string) {
        this.fragmentUrl = `${gatewayUrl}/${this.name}`;
        this.config = config;
    }

    /**
     * Returns fragment placeholder as promise, fetches from gateway
     * @returns {Promise<string>}
     */
    async getPlaceholder(): Promise<string> {
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

    /**
     * Fetches fragment content as promise, fetches from gateway
     * Returns {
     *  html: {
     *    Partials
     *  },
     *  status: gateway status response code
     * }
     * @param attribs
     * @returns {Promise<IfragmentContentResponse>}
     */
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

        //todo pass cookies too
        return fetch(`${this.fragmentUrl}${this.config.render.url}?${querystring.stringify(query)}`
            , {
                timeout: this.config.render.timeout || DEFAULT_CONTENT_TIMEOUT
            })
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

    async getAsset(name: string) {
        if (!this.config) {
            //console.log('No config found')
            return null;
            //todo handle error
        }

        const asset = this.config.assets.find(asset => asset.name === name);
        if (!asset) {
            //console.log('Name not found');
            return null;

            //todo handle named asset not found
        }

        return fetch(`${this.fragmentUrl}/static/${asset.fileName}`).then(async res => {
            return await res.text();
        }).catch(e => {
            //todo handle request error
            return null;
        });
    }

    getAssetPath(name: string) {
        if (!this.config) {
            //console.log('No config found')
            return null;
            //todo handle error
        }

        const asset = this.config.assets.find(asset => asset.name === name);

        if (!asset) {
            //console.log('Name not found');
            return null;

            //todo handle named asset not found
        }

        return `${this.fragmentUrl}/static/${asset.fileName}`;
    }
}
