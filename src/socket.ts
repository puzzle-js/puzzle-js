import socket from "socket.io-client";
import {SENTRY_PATH} from "./config";

class SentrySocket {
  client: SocketIOClient.Socket;

  constructor() {

  }

  connect(cb) {
    let cbRespondStatus = false;
    const cbResponse = (status: boolean) => {
      if (!cbRespondStatus) {
        cbRespondStatus = true;
        if(!status){
          this.client.disconnect();
        }
        cb(status);
      }
    };

    console.log('Connecting to sentry at host', SENTRY_PATH);
    this.client = socket(SENTRY_PATH);

    this.client.on('connect', () => {
      cbResponse(true);
    });

    this.client.on('connect_error', _ => {
      console.log('Connection to sentry failed', SENTRY_PATH);
      cbResponse(false);
    });
  }
}

export {
  SentrySocket
};
