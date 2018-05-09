import {NextFunction, Request, Response} from "express-serve-static-core";
import {Server} from "./server";
import {API_ROUTE_PREFIX} from "./config";
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

export interface IRouteMap {
    [name: string]: IApiHandler
}

export class Api {
    config: IApiConfig;

    constructor(config: IApiConfig) {
        this.config = config;
    }

    public registerEndpoints(app: Server) {
        Object.keys(this.config.versions).forEach(version => {
            const apiHandler = this.config.versions[version];

            app.addUse(`/${API_ROUTE_PREFIX}/${this.config.name}`, (req, res, next) => {
                req.url = `/${version}${req.url}`;
                next();
            });

            apiHandler.forEach(endpoint => {
                app.addRoute(`/${API_ROUTE_PREFIX}/${this.config.name}/${version}${endpoint.path}`, endpoint.method, endpoint.handler, endpoint.middlewares);
            });
        });
    }
}
