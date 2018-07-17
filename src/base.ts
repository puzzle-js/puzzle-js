/**
 * DI Inversifiy
 */
import "reflect-metadata";
import {Server} from "./server";
import {Container} from "inversify";
import {Logger} from "./logger";
import {HttpClient} from "./client";

export const TYPES = {
  Server: Symbol.for('Server'),
  Logger: Symbol.for('Logger'),
  Client: Symbol.for('Client')
};

const container = new Container();
container.bind<Logger>(TYPES.Logger).to(Logger);
container.bind<Server>(TYPES.Server).to(Server);
container.bind<HttpClient>(TYPES.Client).to(HttpClient);

export {container};
