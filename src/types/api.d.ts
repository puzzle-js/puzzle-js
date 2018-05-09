import {NextFunction, Request, Response} from "express-serve-static-core";
import {HTTP_METHODS} from "../lib/enums";

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
