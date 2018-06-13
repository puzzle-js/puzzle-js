/**
 * DI Inversifiy
 */
import "reflect-metadata";
import {Server} from "./server";
import {Container} from "inversify";
import {Logger} from "./logger";

export const TYPES = {
  Server: Symbol.for('Server'),
  Logger: Symbol.for('Logger')
};

const container = new Container();
container.bind<Logger>(TYPES.Logger).to(Logger);
container.bind<Server>(TYPES.Server).to(Server);

export {container};
