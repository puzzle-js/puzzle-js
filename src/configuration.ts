import { Platform } from './enums';
import { SentrySocket } from './socket';

class CastedObject {
  string: string;
  number: number;
  boolean: boolean;
  constructor(value: any) {
    this.string = String(value);
    this.number = Number(value);
    this.boolean = this.stringToBoolean(String(value));
  }

  private stringToBoolean(str: string): boolean {
    switch (str.toLowerCase().trim()) {
      case "true": case "1": return true;
      case "false": case "0": case null: return false;
      default: return Boolean(str);
    }
  }

  static toMap(obj: object): Map<string, CastedObject> {
    return new Map(Object.entries(obj).map(pair => [pair[0], new CastedObject(pair[1])]));
  }
}

class Configuration {
  private static instance: Configuration | null;
  private platform: Platform;
  private name: string;
  private sentrySocket: SentrySocket;
  private processEnv: Map<string, CastedObject>;
  private sentryEnv: Map<string, CastedObject>;

  private constructor(platfrom: Platform, name: string) {
    this.platform = platfrom;
    this.name = name;
    this.sentrySocket = new SentrySocket();
    this.processEnv = CastedObject.toMap(process.env);
  }

  static async setup(platform: Platform, name: string, checkIfSentryIsConnected = true): Promise<void> {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration(platform, name);
      try {
        await Configuration.instance.init(checkIfSentryIsConnected);
      } catch (e) {
        throw Error(`Can not init Configuration for ${platform} - ${name}, Error: ${e}`);
      }
    }
  }

  private subscribeForSentryConfigUpdate() {
    this.sentrySocket.client.on(`configurations.${this.platform}.${this.name}.update`, (data) => {
      if (!data || typeof data !== 'object') return;
      console.log(`got config update for ${this.platform}-${this.name}, data, ${JSON.stringify(data)}`);
      this.updateSentryMap(data);
    });
  }

  private updateSentryMap(data) {
    this.sentryEnv = CastedObject.toMap(data);
  }

  private getSentryData(resolve, reject) {
    this.sentrySocket.client.on(`configurations.${this.platform}.${this.name}`, (data) => {
      if (!data || typeof data !== 'object') reject();
      console.log(`got config for ${this.platform}-${this.name}, data, ${JSON.stringify(data)}`);
      this.updateSentryMap(data);
      resolve();
    });
    this.sentrySocket.client.emit(`configurations.${this.platform}.get`, { name: this.name });
    this.subscribeForSentryConfigUpdate();
  }

  private init(checkIfSentryIsConnected) {
    if (checkIfSentryIsConnected && (!this.sentrySocket.client || !this.sentrySocket.client.connected)) {
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

  static get(value: string): Partial<Pick<CastedObject, 'string' | 'boolean' | 'number'>> {
    let instance: Configuration;
    let result: CastedObject | undefined;

    if (Configuration.instance) {
      instance = Configuration.instance;
    } else {
      throw Error("Instance does not exists");
    }

    result = instance.sentryEnv ? instance.sentryEnv.get(value) : undefined;

    if (typeof result !== 'undefined') {
      return result;
    }

    result = instance.processEnv.get(value);

    if (typeof result !== 'undefined') {
      return result;
    }

    return {
      string: undefined,
      boolean: undefined,
      number: undefined
    };
  }
}

export { Configuration as $configuration };
export { CastedObject };
