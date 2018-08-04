/**
 * DI Inversifiy
 */
import "reflect-metadata";
import {Server} from "./server";
import {Container} from "inversify";
import {Logger} from "./logger";
<<<<<<< HEAD
import {HttpClient} from "./client";

export const TYPES = {
  Server: Symbol.for('Server'),
  Logger: Symbol.for('Logger'),
  Client: Symbol.for('Client')
=======

export const TYPES = {
  Server: Symbol.for('Server'),
  Logger: Symbol.for('Logger')
>>>>>>> bd34369b87f7ac0f3b0aeeae9f08e0e5b4fbde59
};

const container = new Container();
container.bind<Logger>(TYPES.Logger).to(Logger);
container.bind<Server>(TYPES.Server).to(Server);
container.bind<HttpClient>(TYPES.Client).to(HttpClient);

export {container};
