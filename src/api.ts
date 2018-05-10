import {Server} from "./server";
import {API_ROUTE_PREFIX} from "./config";
import {NextFunction, Request, Response} from "express-serve-static-core";
import {HTTP_METHODS} from "./enums";

export interface IApiHandler {
    path: string;
    handler: (req: object, res: object) => any;
    middlewares: ((req: Request, res: Response, next: NextFunction) => void)[];
    method: HTTP_METHODS;
    cacheControl?: string;
    routeCache?: number;
}

export interface IApiConfig {
    name: string;
    testCookie: string;
    liveVersion: string;
    versions: { [name: string]: IApiHandler[] }
}

export class Api {
    config: IApiConfig;

    constructor(config: IApiConfig) {
        this.config = config;
    }

    public registerEndpoints(app: Server) {
        app.addUse(`/${API_ROUTE_PREFIX}/${this.config.name}`, (req, res, next) => {
            const requestVersion = [req.cookies[this.config.testCookie]] ? (this.config.versions[req.cookies[this.config.testCookie]] ? req.cookies[this.config.testCookie] : this.config.liveVersion) : this.config.liveVersion;
            req.url = `/${requestVersion}${req.url}`;
            next();
        });

        Object.keys(this.config.versions).forEach(version => {
            const apiHandler = this.config.versions[version];

            apiHandler.forEach(endpoint => {
                app.addRoute(`/${API_ROUTE_PREFIX}/${this.config.name}/${version}${endpoint.path}`, endpoint.method, endpoint.handler, endpoint.middlewares);
            });
        });
    }
}
