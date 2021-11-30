import https from "https";
import http from "http";

import { IServerOptions } from "./server-options";
import { ExpressHandler } from "./express-handler";

// type Handler = (req: http.IncomingMessage | http2.Http2ServerRequest, res: http.OutgoingMessage | http2.Http2ServerResponse) => void;

export class Server {
  instance: http.Server | https.Server;
  handler;

  private options: IServerOptions;

  constructor(options?: IServerOptions) {
    this.options = options || {};
    this.handler = new ExpressHandler();

    this.instance = this.create();
  }

  listen(cb?: () => void) {
    if (!this.options.hostname) {
      this.instance.listen(this.options.port || 8000, cb);
    } else {
      this.instance.listen(this.options.port || 8000, this.options.hostname, cb);
    }
  }

  close(cb?: ((err?: Error | undefined) => void )) {
    if(this.instance) {
        this.instance.close( () => {
          if (cb) cb();
        });
    }
  }

  private create() {
    if(this.options.http2) {
      console.warn(`Falling back to http1.1 as express doesn't support it yet`);
    }
    if (this.options.https) {
      const httpsSettings = {
        key: this.options.https.key,
        cert: this.options.https.cert,
      };
      return https.createServer(httpsSettings, this.handler.getApp());
    } else {
      return http.createServer(this.handler.getApp());
    }
  }
}
