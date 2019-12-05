import { Platform } from './enums';
import { SentrySocket } from './socket';

class Configuration {
  private static instance: Configuration | null;
  private platform: Platform;
  private name: string;
  private sentrySocket: SentrySocket;
  private processEnv: Map<string, any>;
  private sentryEnv: Map<string, any>;

  private constructor(platfrom: Platform, name: string) {
    this.platform = platfrom;
    this.name = name;
    this.sentrySocket = new SentrySocket();
    this.processEnv = new Map(Object.entries(process.env));
  }

  static async setup(platform: Platform, name: string): Promise<void> {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration(platform, name);
      try {
        await Configuration.instance.init();
      } catch (e) {
        console.log(`Can not init Configuration for ${platform} - ${name}`);
        throw Error(e);
      }
    }
  }

  private getSentryData(resolve, reject) {
    this.sentrySocket.client.on(`configurations.${this.platform}.${this.name}`, (data) => {
      if (!data || typeof data !== 'object') reject();
      console.log(`got config for ${this.platform}-${this.name}, data, ${JSON.stringify(data)}`);
      this.sentryEnv = new Map(Object.entries(data));
      resolve();
    });
    this.sentrySocket.client.emit(`configurations.${this.platform}.get`, { name: this.name });
  }

  private init() {
    if (!this.sentrySocket.client.connected) {
      return new Promise((resolve, reject) => {
        this.sentrySocket.connect((connected) => {
          if (connected) {
            this.getSentryData(resolve, reject);
          } else {
            reject();
          }
        });
      });
    }
    return new Promise((resolve, reject) => {
      this.getSentryData(resolve, reject);
    });
  }

  static getInstance() {
    return Configuration.instance;
  }

  static clearInstance() {
    Configuration.instance = null;
  }

  static getPlatform() {
    return Configuration.instance ? Configuration.instance.platform : null;
  }

  static getName() {
    return Configuration.instance ? Configuration.instance.name : null;
  }

  static get(value: string) {
    let instance: Configuration;
    if (Configuration.instance) {
      instance = Configuration.instance;
    } else {
      throw Error("Instance does not exists");
    }
    const sentryValue = instance.sentryEnv.get(value);
    if (sentryValue === null || sentryValue === undefined) {
      return instance.processEnv.get(value);
    }
    return sentryValue;
  }
}

export { Configuration as $configuration };
