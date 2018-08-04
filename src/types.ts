import {GatewayStorefrontInstance} from "./gatewayStorefront";
import {NextFunction, Request, Response} from "express-serve-static-core";
import {
  HTTP_METHODS,
  REPLACE_ITEM_TYPE,
  RESOURCE_INJECT_TYPE,
  RESOURCE_JS_EXECUTE_TYPE,
  RESOURCE_LOCATION,
<<<<<<< HEAD
  TRANSFER_PROTOCOLS
=======
  RESOURCE_TYPE
>>>>>>> bd34369b87f7ac0f3b0aeeae9f08e0e5b4fbde59
} from "./enums";
import {FragmentStorefront} from "./fragment";
import {Page} from "./page";
import {RESOURCE_LOADING_TYPE, RESOURCE_TYPE} from "./lib/enums";

export interface IFragmentCookieMap {
  name: string;
  live: string;
}

export interface IFragment {
  name: string;
}

export interface IFragmentBFFRender {
<<<<<<< HEAD
  static?: boolean; //todo bunun yenilenen versiyonu
  url: string | string[];
  routeCache?: number;
  selfReplace?: boolean;
  middlewares?: ((req: Request, res: Response, next: NextFunction) => any | string)[];
  cacheControl?: string;
  placeholder?: boolean;
  timeout?: number;
=======
    static?: boolean; //todo bunun yenilenen versiyonu
    url: string | string[];
    routeCache?: number;
    selfReplace?: boolean;
    middlewares?: [ (req: Request, res: Response, next: NextFunction) => any | string];
    cacheControl?: string;
    placeholder?: boolean;
    timeout?: number;
>>>>>>> bd34369b87f7ac0f3b0aeeae9f08e0e5b4fbde59
}

export interface IFragmentHandler {
  content: (req: object, data?: any) => {
    main: string;
    [name: string]: string;
  };
  placeholder: () => string;
  data: (req: object) => Promise<HandlerDataResponse>;
}

export interface HandlerDataResponse {
  [name: string]: any,

  data?: any,
  $status?: number,
  $headers?: {
    [name: string]: string
  },
}

export interface IFileResource {
  name: string;
  type: RESOURCE_TYPE;
}

export interface IFileResourceDependency extends IFileResource {
  link?: string;
  preview?: string;
  injectType?: RESOURCE_INJECT_TYPE;
}

export interface IFileResourceAsset extends IFileResource {
<<<<<<< HEAD
  fileName: string;
  link: string;
  loadMethod: RESOURCE_LOADING_TYPE;
  type: RESOURCE_TYPE;
  name: string;
  dependent?: string[];
=======
    injectType: RESOURCE_INJECT_TYPE;
    fileName: string;
    link?: string;
    location: RESOURCE_LOCATION;
    executeType?: RESOURCE_JS_EXECUTE_TYPE;
>>>>>>> bd34369b87f7ac0f3b0aeeae9f08e0e5b4fbde59
}

export interface IFileResourceStorefrontDependency extends IFileResource {
  content?: string;
  link?: string;
}

export interface IFragmentBFFVersion {
  assets: IFileResourceAsset[];
  dependencies: IFileResourceDependency[];
  handler?: IFragmentHandler;
}

export interface IFragmentBFF extends IFragment {
  versions: {
    [version: string]: IFragmentBFFVersion
  };
  version: string;
  testCookie: string;
  render: IFragmentBFFRender;
}

export interface IExposeFragment {
  version: string;
  testCookie: string;
  render: IFragmentBFFRender;
  assets: IFileResourceAsset[];
  dependencies: IFileResourceDependency[];
}

export interface IGatewayMap {
  [name: string]: GatewayStorefrontInstance;
}

export interface IGatewayConfiguration {
  name: string;
  url: string;
  assetUrl?: string;
}

export interface ICookieMap {
  [cookieName: string]: string;
}

export type IFragmentEndpointHandler = (req: any, res: any, next?: any) => void

export interface IApiHandler {
  path: string;
  middlewares: ((req: Request, res: Response, next: NextFunction) => void)[];
  method: HTTP_METHODS;
  cacheControl?: string;
  routeCache?: number;
  controller: string;
}

export interface IApiVersion {
  handler?: any;
  endpoints: IApiHandler[];
}

export interface IApiConfig {
  name: string;
  testCookie: string;
  liveVersion: string;
  versions: { [version: string]: IApiVersion };
}

export interface IGatewayBFFConfiguration extends IGatewayConfiguration {
  fragments: IFragmentBFF[];
  api: IApiConfig[];
  port: number;
  isMobile?: boolean;
  fragmentsFolder: string;
  corsDomains?: string[];
  spdy?: ISpdyConfiguration;
}

export interface IExposeConfig {
  hash: string;
  fragments: {
    [name: string]: IExposeFragment
  };
}

export interface ICookieObject {
  [name: string]: string;
}

export interface IFragmentContentResponse {
<<<<<<< HEAD
  status: number;
  html: {
    [name: string]: string;
  };
  headers: {
    [name: string]: string;
  },
  model: FragmentModel
=======
    status: number;
    html: {
        [name: string]: string;
    };
    headers: {
        [name: string]: string;
    },
    model: FragmentModel
>>>>>>> bd34369b87f7ac0f3b0aeeae9f08e0e5b4fbde59
}

export interface IPageDependentGateways {
  gateways: {
    [name: string]: {
      gateway: GatewayStorefrontInstance | null,
      ready: boolean
    }
  },
  fragments: {
    [name: string]: {
      instance: FragmentStorefront,
      gateway: string
    }
  }
}

export interface IPageConfiguration {
<<<<<<< HEAD
  html: string;
  url: string | string[];
  name: string;
=======
    html: string;
    url: string | string[];
>>>>>>> bd34369b87f7ac0f3b0aeeae9f08e0e5b4fbde59
}

export interface IPageMap {
  [url: string]: Page;
}

export interface ISpdyConfiguration {
  key: string | Buffer;
  cert: string | Buffer;
  passphrase: string;
  protocols: TRANSFER_PROTOCOLS[];
}

export interface INodeSpdyConfiguration {
  key: string | Buffer;
  cert: string | Buffer;
  passphrase: string;
  spdy: {
    protocols: TRANSFER_PROTOCOLS[];
    'x-forwarded-for': boolean;
    connection: {
      windowSize: number;
      autoSpdy31: boolean;
    }
  }
}

export interface IStorefrontConfig {
  gateways: IGatewayConfiguration[];
  port: number;
  pages: IPageConfiguration[];
  pollInterval?: number;
  dependencies: IFileResourceStorefrontDependency[];
  spdy?: ISpdyConfiguration;
}

export interface IResponseHandlers {
  [versionsHash: string]: Promise<(req: object, res: object) => void>;
}

export interface IReplaceItem {
  key: string;
  type: REPLACE_ITEM_TYPE;
  partial: string;
}

export interface IReplaceSet {
  fragment: FragmentStorefront;
  replaceItems: IReplaceItem[];
  fragmentAttributes: { [name: string]: string };
}

export interface IReplaceAssetSet {
<<<<<<< HEAD
  link: string | undefined | null;
  content: string | undefined | null;
  name: string;
  location: RESOURCE_LOCATION;
  injectType: RESOURCE_INJECT_TYPE;
  executeType: RESOURCE_JS_EXECUTE_TYPE;
=======
    link: string | undefined | null;
    content: string | undefined | null;
    name: string;
    location: RESOURCE_LOCATION;
    injectType: RESOURCE_INJECT_TYPE;
    executeType: RESOURCE_JS_EXECUTE_TYPE;
>>>>>>> bd34369b87f7ac0f3b0aeeae9f08e0e5b4fbde59
}

export interface IReplaceAsset {
  fragment: FragmentStorefront,
  replaceItems: IReplaceAssetSet[]
}

export interface IChunkedReplacementSet {
  fragment: FragmentStorefront;
  replaceItems: IReplaceItem[];
}

export interface IWaitedResponseFirstFlush {
  template: string;
  statusCode: number;
  headers: {
    [name: string]: string;
  };
}

export interface IApiHandlerModule {
  [controller: string]: (req: object, res: object) => any
}

export interface IWrappingJsAsset {
<<<<<<< HEAD
  injectType: RESOURCE_INJECT_TYPE;
  name: string;
  link: string | null | undefined;
  content: string | null | undefined;
  executeType: RESOURCE_JS_EXECUTE_TYPE;
}

export interface IFragmentResponse {
  content: HandlerDataResponse;
  $status: number;
  $headers: {
    [name: string]: string;
  },
  $model: FragmentModel
=======
    injectType: RESOURCE_INJECT_TYPE;
    name: string;
    link: string | null | undefined;
    content: string | null | undefined;
    executeType: RESOURCE_JS_EXECUTE_TYPE;
}

export interface IFragmentResponse {
    content: string;
    $status: number;
    $headers: {
        [name: string]: string;
    },
    $model: FragmentModel
}

export interface FragmentModel {
    [name: string]: any
>>>>>>> bd34369b87f7ac0f3b0aeeae9f08e0e5b4fbde59
}

export interface FragmentModel {
  [name: string]: any
}

