import {Server} from "./server";
import {API_ROUTE_PREFIX} from "./config";
import path from "path";
import {IApiConfig, IApiHandlerModule} from "./types";

export class Api {
    config: IApiConfig;
    private handler: { [version: string]: IApiHandlerModule } = {};

    constructor(config: IApiConfig) {
        this.config = config;

        this.prepareHandlers();
    }

    /**
     * Registers API endpoints /{API_PREFIX}/{APINAME}
     * @param {Server} app
     */
    registerEndpoints(app: Server) {
        app.addUse(`/${API_ROUTE_PREFIX}/${this.config.name}`, (req, res, next) => {
            const requestVersion = [req.cookies[this.config.testCookie]] ? (this.config.versions[req.cookies[this.config.testCookie]] ? req.cookies[this.config.testCookie] : this.config.liveVersion) : this.config.liveVersion;
            req.headers["originalurl"] = req.url;
            req.headers["originalpath"] = req.path;
            req.url = `/${requestVersion}${req.url}`;
            next();
        });

        Object.keys(this.config.versions).forEach(version => {
            const apiHandler = this.config.versions[version];

            apiHandler.endpoints.forEach(endpoint => {
                app.addRoute(`/${API_ROUTE_PREFIX}/${this.config.name}/${version}${endpoint.path}`, endpoint.method, this.handler[version][endpoint.controller], endpoint.middlewares);
            });
        });
    }

    /**
     * Resolves version handlers based on configuration
     */
    private prepareHandlers() {
        Object.keys(this.config.versions).forEach(version => {
            const configurationHandler = this.config.versions[version].handler;

            if (configurationHandler) {
                this.handler[version] = configurationHandler;
            } else {
                const module = require(path.join(process.cwd(), `/src/api/`, this.config.name, version));
                this.handler[version] = module;
            }
        });
    }
}
