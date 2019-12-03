import { Platform } from './enums';
import { SentrySocket } from './socket';

class Configuration {
  private platform: Platform;
  private name: string;
  private sentrySocket: SentrySocket;
  private data;

  constructor(platfrom: Platform, name: string) {
    this.platform = platfrom;
    this.name = name;
    this.sentrySocket = new SentrySocket();
  }

  private handler = {
    get: (target, key) => {
      if (!this.data) return;
      return (key in this.data) ? this.data[key] : target[key];
    }
  };

  private init() {
    return new Promise((resolve, reject) => {
      return this.sentrySocket.connect((connected) => {
        if (!connected) reject();
        this.sentrySocket.client.on(`configurations.${this.platform}.${this.name}`, (data) => {
          console.log(`got config for ${this.platform}-${this.name}, data, ${JSON.stringify(data)}`);
          this.data = data;
          resolve();
        });
        this.sentrySocket.client.emit(`configurations.${this.platform}.get`, { name: this.name });
      });
    });
  }

  async get() {
    try {
      await this.init();
    } catch (e) {
      console.log(`Can not init Configuration for ${this.platform} - ${this.name}`);
      throw Error(e);
    }
    return new Proxy(process.env, this.handler);
  }
}

export { Configuration };