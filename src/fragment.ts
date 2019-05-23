import fetch from "node-fetch";
import {ICookieMap, IExposeFragment, IFileResourceAsset, IFragment, IFragmentContentResponse} from "./types";
import {CONTENT_ENCODING_TYPES, FRAGMENT_RENDER_MODES} from "./enums";
import * as querystring from "querystring";
import {DEFAULT_CONTENT_TIMEOUT} from "./config";
import url from "url";
import {container, TYPES} from "./base";
import {Logger} from "./logger";
import {decompress} from "iltorb";
import {Request} from 'express';
import {HttpClient} from "./client";
import {ERROR_CODES, PuzzleError} from "./errors";
import {CookieVersionMatcher} from "./cookie-version-matcher";


const logger = container.get(TYPES.Logger) as Logger;
const httpClient = container.get(TYPES.Client) as HttpClient;

export class Fragment {
    name: string;

    constructor(config: IFragment) {
        this.name = config.name;
    }
}


export class FragmentStorefront extends Fragment {
    config: IExposeFragment | undefined;
    primary = false;
    shouldWait = false;
    from: string;
    gatewayPath!: string;
    fragmentUrl: string | undefined;
    assetUrl: string | undefined;
    private versionMatcher?: CookieVersionMatcher;
    private cachedErrorPage: string | undefined;
    private gatewayName: string;

    constructor(name: string, from: string) {
        super({name});

        this.from = from;
    }

    /**
     * Updates fragment configuration
     * @param {IExposeFragment} config
     * @param {string} gatewayUrl
     * @param gatewayName
     * @param {string | undefined} assetUrl
     */
    update(config: IExposeFragment, gatewayUrl: string, gatewayName: string, assetUrl?: string | undefined) {
        if (assetUrl) {
            this.assetUrl = url.resolve(assetUrl, this.name);
        }
        this.fragmentUrl = url.resolve(gatewayUrl, this.name);

        const hostname = url.parse(gatewayUrl).hostname;
        if (hostname) {
            this.gatewayPath = hostname;
        }

        this.gatewayName = gatewayName;

        this.config = config;

        if (this.config && this.config.versionMatcher) {
            this.versionMatcher = new CookieVersionMatcher(this.config.versionMatcher);
        }

        if (this.config && this.config.render.error && !this.cachedErrorPage) {
            this.getErrorPage();
        }

    }

    detectVersion(cookie: ICookieMap, preCompile = false): string {
        if (!this.config) return '0';

        const cookieKey = this.config.testCookie;
        const cookieVersion = cookie[cookieKey];

        if (cookieVersion) {
            return cookieVersion;
        }

        if (!preCompile && this.versionMatcher) {
            const version = this.versionMatcher.match(cookie);
            if (version) return version;
        }

        return this.config.version;
    }

    /**
     * Returns fragment placeholder as promise, fetches from gateway
     * @returns {Promise<string>}
     */
    async getPlaceholder(): Promise<string> {
        logger.info(`Trying to get placeholder of fragment: ${this.name}`);

        if (!this.config) {
            logger.error(new Error(`No config provided for fragment: ${this.name}`));
            return '';
        }

        if (!this.config.render.placeholder) {
            logger.error(new Error('Placeholder is not enabled for fragment'));
            return '';
        }

        return fetch(`${this.fragmentUrl}/placeholder`, {
            headers: {
                gateway: this.gatewayName
            }
        })
            .then(res => res.text())
            .then(html => {
                logger.info(`Received placeholder contents of fragment: ${this.name}`);
                return html;
            })
            .catch(err => {
                logger.error(`Failed to fetch placeholder for fragment: ${this.fragmentUrl}/placeholder`, err);
                return '';
            });
    }


    /**
     * Returns fragment error as promise, fetches from gateway
     * @returns { Promise<string> }
     */
    async getErrorPage(): Promise<string> {
        logger.info(`Trying to get error page of fragment: ${this.name}`);

        if (!this.config || !this.config.render.error) {
            logger.warn(new Error('Error is not enabled for fragment'));
            return '';
        }

        if (this.cachedErrorPage) {
            return this.cachedErrorPage;
        }

        return fetch(`${this.fragmentUrl}/error`, {
            headers: {
                gateway: this.gatewayName
            }
        })
            .then(res => res.json())
            .then(html => {
                this.cachedErrorPage = html;
                return html;
            })
            .catch(err => {
                logger.error(`Failed to fetch error for fragment: ${this.fragmentUrl}/error`, err);
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
     * @param req
     * @returns {Promise<IFragmentContentResponse>}
     */
    async getContent(attribs: any = {}, req?: Request): Promise<IFragmentContentResponse> {
        logger.info(`Trying to get contents of fragment: ${this.name}`);
        if (!this.config) {
            logger.error(new Error(`No config provided for fragment: ${this.name}`));
            return {
                status: 500,
                html: {},
                headers: {},
                model: {}
            };
        }

        let query = {
            ...attribs,
            __renderMode: FRAGMENT_RENDER_MODES.STREAM
        };

        let parsedRequest;
        const requestConfiguration: any = {
            timeout: this.config.render.timeout || DEFAULT_CONTENT_TIMEOUT,
        };

        if (req) {
            if (req.url) {
                parsedRequest = url.parse(req.url) as { pathname: string };
                query = {
                    ...query,
                    ...req.query,
                };
            }
            if (req.headers) {
                requestConfiguration.headers = req.headers;
                requestConfiguration.headers['originalurl'] = req.url;
                requestConfiguration.headers['originalpath'] = req.path;
            }
        }

        requestConfiguration.headers = {
            ...requestConfiguration.headers,
            gateway: this.gatewayName
        } || {gateway: this.gatewayName};


        delete query.from;
        delete query.name;
        delete query.partial;
        delete query.primary;
        delete query.shouldwait;

        const routeRequest = req && parsedRequest ? `${parsedRequest.pathname.replace('/' + this.name, '')}?${querystring.stringify(query)}` : `/?${querystring.stringify(query)}`;

        return httpClient.get(`${this.fragmentUrl}${routeRequest}`, this.name, {
            json: true,
            gzip: true,
            ...requestConfiguration
        }).then(res => {
            logger.info(`Received fragment contents of ${this.name} with status code ${res.response.statusCode}`);
            return {
                status: res.data.$status || res.response.statusCode,
                headers: res.data.$headers || {},
                html: res.data,
                model: res.data.$model || {}
            };
        }).catch(async (err) => {
            logger.error(new PuzzleError(ERROR_CODES.FAILED_TO_GET_FRAGMENT_CONTENT, this.name, `${this.fragmentUrl}${routeRequest}`), this.name, `${this.fragmentUrl}${routeRequest}`, `${this.fragmentUrl}${routeRequest}`, {json: true, ...requestConfiguration}, err);

            const errorPage = await this.getErrorPage();

            return {
                status: errorPage ? 200 : 500,
                html: errorPage ? errorPage : {},
                headers: {},
                model: {}
            };
        });
    }

    /**
     * Returns asset content
     * @param {string} name
     * @param targetVersion
     * @returns {Promise<string>}
     */
    async getAsset(name: string, targetVersion: string) {
        logger.info(`Trying to get asset: ${name}`);

        if (!this.config) {
            logger.error(new Error(`No config provided for fragment: ${this.name}`));
            return null;
        }

        let fragmentVersion: { assets: IFileResourceAsset[] } = this.config;

        if (targetVersion !== this.config.version && this.config.passiveVersions && this.config.passiveVersions[targetVersion]) {
            fragmentVersion = this.config.passiveVersions[targetVersion];
        }

        const asset = fragmentVersion.assets.find(asset => asset.name === name);

        if (!asset) {
            logger.error(new Error(`Asset not declared in fragments asset list: ${name}`));
            return null;
        }

        return fetch(asset.link || `${this.fragmentUrl}/static/${asset.fileName}`, {
            headers: {
                gateway: this.gatewayName
            }
        }).then(async res => {
            logger.info(`Asset received: ${name}`);
            const encoding = res.headers.get('content-encoding');

            switch (encoding) {
                case CONTENT_ENCODING_TYPES.BROTLI:
                    return await decompress(await res.buffer());
                default:
                    return await res.text();
            }
        }).catch(e => {
            logger.error(new Error(`Failed to fetch asset from gateway: ${this.fragmentUrl}/static/${asset.fileName}`));
            return null;
        });
    }

    /**
     * Returns asset path
     * @param {string} name
     * @returns {string}
     */
    getAssetPath(name: string) {
        if (!this.config) {
            logger.error(new Error(`No config provided for fragment: ${this.name}`));
            return null;
        }

        const asset = this.config.assets.find(asset => asset.name === name);

        if (!asset) {
            logger.error(new Error(`Asset not declared in fragments asset list: ${name}`));
            return null;
        }

        return asset.link || `${this.assetUrl || this.fragmentUrl}/static/${asset.fileName}`;
    }
}

