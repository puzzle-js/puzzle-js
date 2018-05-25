/**
 * DI Inversifiy
 */
import "reflect-metadata";
import {Server} from "./server";
import {Container} from "inversify";

export const TYPES = {
    Server: Symbol.for('Server'),
};

const container = new Container();
container.bind<Server>(TYPES.Server).to(Server);

export { container };
