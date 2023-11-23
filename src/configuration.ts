import { Platform } from './enums';

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
  private processEnv: Map<string, CastedObject>;

  private constructor(platfrom: Platform, name: string) {
    this.platform = platfrom;
    this.name = name;
    this.processEnv = CastedObject.toMap(process.env);
  }

  static async setup(platform: Platform, name: string): Promise<void> {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration(platform, name);
    }
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
