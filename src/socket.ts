import socket from "socket.io-client";
import {SENTRY_IP} from "./config";

class SentrySocket {
  client: SocketIOClient.Socket;

  constructor() {

  }

  connect(cb) {
    let cbRespondStatus = false;
    const cbResponse = (status: boolean) => {
      if (!cbRespondStatus) {
        cbRespondStatus = true;
        cb(status);
      }
    };

    console.log('Connecting to sentry at host', SENTRY_IP);
    this.client = socket(SENTRY_IP);

    this.client.on('connect', () => {
      cbResponse(true);
    });

    this.client.on('connect_error', _ => {
      console.log('Connection to sentry failed', SENTRY_IP);
      cbResponse(false);
    });
  }
}

export {
  SentrySocket
};
