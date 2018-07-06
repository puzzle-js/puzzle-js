import {GatewayStorefrontInstance} from "./gatewayStorefront";
import {NextFunction, Request, Response} from "express-serve-static-core";
import {
  HTTP_METHODS,
  REPLACE_ITEM_TYPE,
  RESOURCE_INJECT_TYPE,
  RESOURCE_JS_EXECUTE_TYPE,
  RESOURCE_LOCATION,
  TRANSFER_PROTOCOLS
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
  static?: boolean; //todo bunun yenilenen versiyonu
  url: string | string[];
  routeCache?: number;
  selfReplace?: boolean;
  middlewares?: ((req: Request, res: Response, next: NextFunction) => any | string)[];
  cacheControl?: string;
  placeholder?: boolean;
  timeout?: number;
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
  fileName: string;
  link?: string;
  loadMethod: RESOURCE_LOADING_TYPE;
  type: RESOURCE_TYPE;
  name: string;
  dependent?: string[];
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
  status: number;
  html: {
    [name: string]: string;
  };
  headers: {
    [name: string]: string;
  },
  model: FragmentModel
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
  html: string;
  url: string | string[];
  name: string;
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
  [versionsHash: string]: (req: object, res: object) => void;
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
  link: string | undefined | null;
  content: string | undefined | null;
  name: string;
  location: RESOURCE_LOCATION;
  injectType: RESOURCE_INJECT_TYPE;
  executeType: RESOURCE_JS_EXECUTE_TYPE;
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
}

export interface FragmentModel {
  [name: string]: any
}

