import express, {Express, NextFunction, Request, Response} from "express";
import morgan from "morgan";
import responseTime from "response-time";
import {ServeStaticOptions} from "serve-static";
import bodyParser from "body-parser";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import shrinkRay from "shrink-ray-current";
import compression from "compression";
import {injectable} from "inversify";

import {pubsub} from "../util";
import {EVENTS, HTTP_METHODS} from "../enums";
import {ICustomHeader} from "../types";
import {BROTLI, NO_COMPRESS_QUERY_NAME, USE_HELMET, USE_MORGAN} from "../config";
import {Logger} from "../logger";

const morganLoggingLevels = [
    'Date: [:date[clf]]',
    'IP: :remote-addr',
    'Client-IP: :req[client-ip]',
    'REQ: :method :url',
    'RES: :status :response-time ms',
    'UA: :user-agent',
    'x-correlationId: :req[x-correlationId]',
    'x-agentname: :req[x-agentname]',
    'referer: :req[referer]',
];

@injectable()
export class ExpressHandler {

    private readonly app: Express;

    constructor() {
        this.app = express();
        this.addMiddlewares();
        pubsub.on(EVENTS.ADD_ROUTE, (e: { path: string, method: HTTP_METHODS, handler: (req: Request, res: Response, next: NextFunction) => any }) => {
            this.addRoute(
                e.path,
                e.method,
                e.handler
            );
        });

    }

    /**
     * Adds new route
     * @param {string} path
     * @param {HTTP_METHODS} method
     * @param {(req: Request, res: Response, next: NextFunction) => any} handler
     * @param {RequestHandlerParams[]} middlewares
     */
    addRoute(path: string | string[], method: HTTP_METHODS, handler: (req: Request, res: Response, next: NextFunction) => any, middlewares: any[] = []) {
        this.app[method](path, middlewares, handler);
    }

    /**
     * Register new middleware to route
     * @param {string | null} path
     * @param {(req: Request, res: Response, next: NextFunction) => any} handler
     */
    addUse(path: string | null, handler: (req: Request, res: Response, next: NextFunction) => any) {
        if (path) {
            this.app.use(path, handler);
        } else {
            this.app.use(handler);
        }
    }

    /**
     * Registers static routes
     * @param {string | null} path
     * @param {string} source
     * @param {serveStatic.ServeStaticOptions} staticOptions
     */
    setStatic(path: string | null, source: string, staticOptions?: ServeStaticOptions) {
        if (!staticOptions) {
            this.addUse(path, express.static(source));
        } else {
            this.addUse(path, express.static(source, staticOptions));
        }
    }

    /**
     * Adds custom headers
     * @param {Array<ICustomHeader>} customHeaders
     */
    addCustomHeaders(customHeaders?: ICustomHeader[]) {
        if (customHeaders) {
            this.addUse(null, (req, res, next) => {
                customHeaders.forEach((customHeader) => {
                    let value: string | undefined = customHeader.value.toString();
                    if (customHeader.isEnv && value && process.env[value]) {
                        value = process.env[value];
                    }
                    res.header(customHeader.key, value);
                });
                next();
            });
        }
    }

    /**
     * Predefined middlewares
     * @returns {boolean}
     */
    private addMiddlewares() {
        this.app.use(responseTime());
        if (USE_MORGAN) this.app.use(morgan(morganLoggingLevels.join('||'), { stream: Logger.prototype }));
        if (USE_HELMET) this.app.use(helmet());
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());

        const compressionMethod = BROTLI ? shrinkRay : compression;
        this.app.use(compressionMethod({
            filter(req: any) {
                return !req.query[NO_COMPRESS_QUERY_NAME];
            }
        }));
    }

}
