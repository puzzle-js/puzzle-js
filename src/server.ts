import express, {Express} from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import "reflect-metadata";
import morgan from "morgan";
import bodyParser from "body-parser";
import * as Http from "http";
import {NextFunction, Request, RequestHandlerParams, Response} from "express-serve-static-core";
import {ServeStaticOptions} from "serve-static";
import {EVENTS, HTTP_METHODS, TRANSFER_PROTOCOLS} from "./enums";
import {Logger} from "./logger";
import https from "https";
import {pubsub} from "./util";
import compression from "compression";
import {injectable} from "inversify";
import responseTime from "response-time";
import {GLOBAL_REQUEST_TIMEOUT, NO_COMPRESS_QUERY_NAME, USE_HELMET, USE_MORGAN} from "./config";
import {ICustomHeader, INodeSpdyConfiguration, ISpdyConfiguration} from "./types";
import spdy from "spdy";


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
export class Server {
    app: Express;
    server!: Http.Server | spdy.Server | null;
    private spdyConfiguration: INodeSpdyConfiguration;


    constructor() {
        this.app = express();
        this.server = null;
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
     * Sets spdy protocol configuration.
     * @param {ISpdyConfiguration} options
     */
    useProtocolOptions(options?: ISpdyConfiguration) {
        if (options) {
            this.spdyConfiguration = {
                cert: options.cert,
                key: options.key,
                passphrase: options.passphrase,
                spdy: {
                    "x-forwarded-for": true,
                    protocols: options.protocols,
                    connection: {
                        windowSize: 1024 * 1024,
                        autoSpdy31: false
                    }
                }
            };
        }
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
     * Adds new route
     * @param {string} path
     * @param {HTTP_METHODS} method
     * @param {(req: Request, res: Response, next: NextFunction) => any} handler
     * @param {RequestHandlerParams[]} middlewares
     */
    addRoute(path: string | string[], method: HTTP_METHODS, handler: (req: Request, res: Response, next: NextFunction) => any, middlewares: RequestHandlerParams[] = []) {
        (this.app as any)[method](path, middlewares, handler);
    }


    /**
     * Starts server
     * @param {number} port
     * @param {Function} cb
     * @param ipv4
     */
    listen(port: number, cb?: Function, ipv4?: boolean) {
        const args: any = [port];
        if (ipv4) {
            args.push('0.0.0.0');
        }
        args.push((e: Error) => {
            cb && cb(e);
        });
        if (this.spdyConfiguration && (this.spdyConfiguration.spdy.protocols.includes(TRANSFER_PROTOCOLS.H2) || this.spdyConfiguration.spdy.protocols.includes(TRANSFER_PROTOCOLS.SPDY))) {
            this.server = spdy.createServer(this.spdyConfiguration, this.app);
            this.server.listen.apply(this.server, args);
        } else {
            if (this.spdyConfiguration && this.spdyConfiguration.cert && this.spdyConfiguration.key) {
                this.server = https.createServer({
                    cert: this.spdyConfiguration.cert,
                    key: this.spdyConfiguration.key
                }, this.app);
                this.server.listen.apply(this.server, args);
            } else {
                this.server = this.app.listen.apply(this.app, args);
            }
        }
        if (this.server) {
            this.server.setTimeout(GLOBAL_REQUEST_TIMEOUT);
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
                    if (customHeader.isEnv && process.env[value]) {
                        value = process.env[value];
                    }
                    res.header(customHeader.key, value);
                });
                next();
            });
        }
    }

    /**
     * Clears instances, stops listening
     */
    close() {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.app = express();
            this.addMiddlewares();
        }
    }

    /**
     * Predefined middlewares
     * @returns {boolean}
     */
    private addMiddlewares() {
        this.app.use(responseTime());
        if (USE_MORGAN) this.app.use(morgan(morganLoggingLevels.join('||'), {stream: Logger.prototype}));
        if (USE_HELMET) this.app.use(helmet());
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());
        this.app.use(compression({
            filter(req: any) {
                return !req.query[NO_COMPRESS_QUERY_NAME];
            }
        }));
    }
}
