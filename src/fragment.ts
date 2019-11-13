import fetch from "node-fetch";
import {
  HandlerDataResponse, ICookieMap,
  IExposeFragment,
  IFileResourceAsset,
  IFragment,
  IFragmentBFF,
  IFragmentContentResponse,
  IFragmentHandler
} from "./types";
import {CONTENT_ENCODING_TYPES, FRAGMENT_RENDER_MODES} from "./enums";
import * as querystring from "querystring";
import {DEBUG_QUERY_NAME, DEFAULT_CONTENT_TIMEOUT, PREVIEW_PARTIAL_QUERY_NAME, RENDER_MODE_QUERY_NAME} from "./config";
import url from "url";
import path from "path";
import {container, TYPES} from "./base";
import {Logger} from "./logger";
import {decompress} from "iltorb";
// TODO: remove this
import {Request} from 'express';
import {HttpClient} from "./client";
import {ERROR_CODES, PuzzleError} from "./errors";
import express from "express";
import {CookieVersionMatcher} from "./cookie-version-matcher";
import {AssetManager} from "./asset-manager";


const logger = container.get(TYPES.Logger) as Logger;
const httpClient = container.get(TYPES.Client) as HttpClient;

export class Fragment {
  name: string;

  constructor(config: IFragment) {
    this.name = config.name;
  }
}

export class FragmentBFF extends Fragment {
  config: IFragmentBFF;
  versionMatcher?: CookieVersionMatcher;
  private handler: { [version: string]: IFragmentHandler } = {};

  constructor(config: IFragmentBFF) {
    super({name: config.name});
    this.config = config;

    if (this.config.versionMatcher) {
      this.versionMatcher = new CookieVersionMatcher(this.config.versionMatcher);
    }

    this.prepareHandlers();
  }

  /**
   * Renders fragment: data -> content
   * @param {object} req
   * @param {string} version
   * @returns {Promise<HandlerDataResponse>}
   */
  async render(req: express.Request, version: string): Promise<HandlerDataResponse> {
    const handler = this.handler[version] || this.handler[this.config.version];
    const clearedRequest = this.clearRequest(req);
    if (handler) {
      if (handler.data) {
        let dataResponse;
        try {
          dataResponse = await handler.data(clearedRequest);
        } catch (e) {
          logger.error(`Failed to fetch data for fragment ${this.config.name}`, req.url, req.query, req.params, req.headers, e);
          return {
            $status: 500
          };
        }
        if (dataResponse.data) {
          const renderedPartials = handler.content(dataResponse.data);
          delete dataResponse.data;
          return {
            ...renderedPartials,
            ...dataResponse
          };
        } else {
          return dataResponse;
        }
      } else {
        throw new Error(`Failed to find data handler for fragment. Fragment: ${this.config.name}, Version: ${version || this.config.version}`);
      }
    } else {
      throw new Error(`Failed to find fragment version. Fragment: ${this.config.name}, Version: ${version || this.config.version}`);
    }
  }

  /**
   * Renders placeholder
   * @param {object} req
   * @param {string} version
   * @returns {string}
   */
  placeholder(req: object, version?: string) {
    const fragmentVersion = (version && this.config.versions[version]) ? version : this.config.version;
    const handler = this.handler[fragmentVersion];
    if (handler) {
      return handler.placeholder();
    } else {
      throw new Error(`Failed to find fragment version. Fragment: ${this.config.name}, Version: ${version || this.config.version}`);
    }
  }

  /**
   * Renders error
   * @param {object} req
   * @param {string} version
   * @returns {string}
   */
  errorPage(req: object, version?: string) {
    const fragmentVersion = (version && this.config.versions[version]) ? version : this.config.version;
    const handler = this.handler[fragmentVersion];
    if (handler) {
      return handler.error();
    } else {
      throw new Error(`Failed to find fragment version. Fragment: ${this.config.name}, Version: ${version || this.config.version}`);
    }
  }

  /**
   * Purifies req.path, req.query from Puzzle elements.
   * @param req
   * @returns {*}
   */
  private clearRequest(req: express.Request) {
    const clearedReq = Object.assign({}, req);
    if (req.query) {
      delete clearedReq.query[RENDER_MODE_QUERY_NAME];
      delete clearedReq.query[PREVIEW_PARTIAL_QUERY_NAME];
      delete clearedReq.query[DEBUG_QUERY_NAME];
    }
    if (req.path) {
      clearedReq.path = req.path.replace(`/${this.name}`, '');
    }
    return clearedReq;
  }

  /**
   * Check module type
   */
  private checkModuleType(fragmentModule: IFragmentHandler | Function): IFragmentHandler {
    if (typeof fragmentModule === "function") return fragmentModule(container);
    return fragmentModule;
  }

  /**
   * Resolve handlers based on configuration
   */
  private prepareHandlers() {
    Object.keys(this.config.versions).forEach(version => {
      const configurationHandler = this.config.versions[version].handler;
      if (configurationHandler) {
        this.handler[version] = configurationHandler;
      } else {
        const module = require(path.join(process.cwd(), `/src/fragments/`, this.config.name, version));
        this.handler[version] = this.checkModuleType(module);
      }
    });
  }
}

export class FragmentStorefront extends Fragment {
  get attributes(): { [p: string]: string } {
    return this._attributes;
  }

  set attributes(value: { [p: string]: string }) {
    delete value.primary;
    delete value['client-async'];
    delete value.name;
    delete value.from;
    delete value.primary;
    delete value.shouldwait;
    delete value.partial;
    this._attributes = value;
  }

  config: IExposeFragment | undefined;
  primary = false;
  shouldWait = false;
  asyncDecentralized = false;
  clientAsync = false;
  from: string;
  gatewayPath!: string;
  fragmentUrl: string | undefined;
  assetUrl: string | undefined;
  private _attributes: { [p: string]: string };
  private versionMatcher?: CookieVersionMatcher;
  private cachedErrorPage: string | undefined;
  private gatewayName: string;


  constructor(name: string, from: string, attributes?: {[name: string]: string}) {
    super({name});

    this._attributes = attributes || {};
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
      logger.warn('Error page is not enabled for fragment');
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
        logger.error(`Failed to fetch error page for fragment: ${this.fragmentUrl}/error`, err);
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
  // @nrSegmentAsync("fragment.getContent", true)
  async getContent(attribs: any = {}, req?: Request): Promise<IFragmentContentResponse> {
    logger.info(`Trying to get contents of fragment: ${this.name}`);
    if (!this.config) {
      logger.error(new Error(`No config provided for fragment: ${this.name}`));
      return {
        status: 500,
        html: {},
        headers: {},
        cookies: {},
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
        cookies: res.data.$cookies || {},
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
        cookies: {},
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

    const link = (asset.link || `${this.fragmentUrl}/static/${asset.fileName}`) + `?__version=${targetVersion}`;


    return await AssetManager.getAsset(link, this.gatewayName);


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

