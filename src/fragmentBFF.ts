import {HandlerDataResponse, IFragmentBFF, IFragmentHandler} from "./types";
import {CookieVersionMatcher} from "./cookie-version-matcher";
import {DEBUG_QUERY_NAME, PREVIEW_PARTIAL_QUERY_NAME, RENDER_MODE_QUERY_NAME} from "./config";
import {container, TYPES} from "./base";
import path from "path";
import {Logger} from "./logger";
import {Fragment} from "./fragment";
import express from "express";
import {FragmentPropBuilder} from "./fragment-prop-builder";

const logger = container.get(TYPES.Logger) as Logger;

export class FragmentBFF extends Fragment {
    config: IFragmentBFF;
    versionMatcher?: CookieVersionMatcher;
    private handler: { [version: string]: IFragmentHandler } = {};
    private propBuilder: FragmentPropBuilder;

    constructor(config: IFragmentBFF, propBuilder: FragmentPropBuilder = new FragmentPropBuilder()) {
        super({name: config.name});
        this.config = config;
        this.propBuilder = propBuilder;

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
        const fragmentProperties = this.propBuilder.parseFragmentProperties(clearedRequest, this.config.props);

        if (handler) {
            if (handler.data) {
                let dataResponse;
                try {
                    dataResponse = await handler.data(fragmentProperties);
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
    placeholder(req: express.Request, version?: string) {
        const fragmentVersion = (version && this.config.versions[version]) ? version : this.config.version;
        const clearedRequest = this.clearRequest(req);
        const fragmentProperties = this.propBuilder.parseFragmentProperties(clearedRequest, this.config.props);
        const handler = this.handler[fragmentVersion];
        if (handler) {
            return handler.placeholder(fragmentProperties);
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
