import http from "http";
import {Server} from "./server";


class Application {
  constructor() {
    this.handler = this.handler.bind(this);
  }

  init() {
    const server = new Server(this.handler as any);
  }

  private handler(req: http.IncomingMessage, res: http.OutgoingMessage) {

  }
}

