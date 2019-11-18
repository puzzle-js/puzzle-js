/**
 * DI Inversifiy
 */
require('events').EventEmitter.defaultMaxListeners = 20;

import "reflect-metadata";
import {Container} from "inversify";
import {Logger} from "./logger";
import {HttpClient} from "./client";
import dnscache from "dnscache";



export const TYPES = {
    Logger: Symbol.for('Logger'),
    Client: Symbol.for('Client')
};

const container = new Container();
container.bind<Logger>(TYPES.Logger).to(Logger);
container.bind<HttpClient>(TYPES.Client).to(HttpClient);


dnscache({
    enable: true,
    ttl: 300,
    cachesize: 1000
});

export {container};
