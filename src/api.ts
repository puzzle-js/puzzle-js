import { Server } from "./network";
import { API_ROUTE_PREFIX } from "./config";
import path from "path";
import { IApiConfig, IApiHandlerModule, ICookieMap } from "./types";
import { CookieVersionMatcher } from "./cookie-version-matcher";

export class Api {
    config: IApiConfig;
    versionMatcher?: CookieVersionMatcher;
    private handler: { [version: string]: IApiHandlerModule } = {};

    constructor(config: IApiConfig) {
        this.config = config;

        if (this.config.versionMatcher) {
            this.versionMatcher = new CookieVersionMatcher(this.config.versionMatcher);
        }

        this.prepareHandlers();
    }

    private controllerWrapper(handler) {
        return (req, res) => {
            handler(req, res).catch((e) => {
                console.error("PUZZLE_BFF_HANDLER_UNHANDLED_ERROR");
                console.error(e);
                return res.status(500).send();
            });
        };
    }

    /**
     * Registers API endpoints /{API_PREFIX}/{APINAME}
     * @param {Server} server
     */
    registerEndpoints(server: Server) {
        server.handler.addUse(`/${API_ROUTE_PREFIX}/${this.config.name}`, (req, res, next) => {
            const requestVersion = this.detectVersion(req.cookies);

            req.headers["originalurl"] = req.url;
            req.headers["originalpath"] = req.path;
            req.url = `/${requestVersion}${req.url}`;
            next();
        });

        Object.keys(this.config.versions).forEach(version => {
            const apiHandler = this.config.versions[version];

            apiHandler.endpoints.forEach(endpoint => {
                server.handler.addRoute(`/${API_ROUTE_PREFIX}/${this.config.name}/${version}${endpoint.path}`, endpoint.method, this.controllerWrapper(this.handler[version][endpoint.controller]), endpoint.middlewares);
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
                this.handler[version] = require(path.join(process.cwd(), `/src/api/`, this.config.name, version));
            }
        });
    }

    private detectVersion(cookie: ICookieMap): string {
        const cookieKey = this.config.testCookie;
        const cookieVersion = cookie[cookieKey] && this.config.versions[cookie[cookieKey]] ? cookie[cookieKey] : null;

        if (cookieVersion) return cookieVersion;

        const matcherVersion = this.versionMatcher ? this.versionMatcher.match(cookie) : null;
        if (matcherVersion && this.config.versions[matcherVersion]) return matcherVersion;

        return this.config.liveVersion;
    }
}
