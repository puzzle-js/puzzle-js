import express, {Express} from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import compression from "compression";
import * as Http from "http";
import {NextFunction, Request, RequestHandlerParams, Response} from "express-serve-static-core";
import {ServeStaticOptions} from "serve-static";
import {EVENTS, HTTP_METHODS} from "./enums";
import {stream} from "./logger";
import {pubsub} from "./util";


//todo connect morgan
const morganLoggingLevels = [
    'Date: [:date[clf]]',
    'IP: :remote-addr',
    'REQ: :method :url',
    'RES: :status :response-time ms',
    'UA: :user-agent',
];

export class Server {
    app: Express;
    server: Http.Server | null;

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

    public addUse(path: string | null, handler: (req: Request, res: Response, next: NextFunction) => any) {
        if (path) {
            this.app.use(path, handler);
        } else {
            this.app.use(handler);
        }
    }

    public setStatic(path: string | null, source: string, staticOptions?: ServeStaticOptions) {
        if (!staticOptions) {
            this.addUse(path, express.static(source));
        } else {
            this.addUse(path, express.static(source, staticOptions));
        }
    }

    public addRoute(path: string, method: HTTP_METHODS, handler: (req: Request, res: Response, next: NextFunction) => any, middlewares: RequestHandlerParams[] = []) {
        (this.app as any)[method](path, middlewares, handler);
    }


    public listen(port: number, cb?: Function) {
        this.server = this.app.listen(port, (e: Error) => {
            cb && cb(e);
        });
    }

    public close() {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.app = express();
            this.addMiddlewares();
        }
    }

    private addMiddlewares() {
        this.app.use(morgan(morganLoggingLevels.join('||'), {stream}));
        this.app.use(helmet());
        this.app.use(bodyParser.urlencoded({extended: false}));
        this.app.use(cookieParser());
        this.app.use(cors());
        //this.app.use(compression()); //todo must work on it
    }
}
