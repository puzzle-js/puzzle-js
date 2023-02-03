import { GatewayStorefrontInstance } from "./gatewayStorefront";
import { NextFunction, Request, Response } from "express-serve-static-core";
import {
    FragmentSentryConfig,
    HTTP_METHODS,
    REPLACE_ITEM_TYPE,
    RESOURCE_INJECT_TYPE,
    RESOURCE_JS_EXECUTE_TYPE,
    RESOURCE_CSS_EXECUTE_TYPE,
    RESOURCE_LOCATION
} from "./enums";
import { FragmentStorefront } from "./fragment";
import { RESOURCE_LOADING_TYPE, RESOURCE_TYPE } from "@puzzle-js/client-lib/dist/enums";
import { RouteConfiguration } from "puzzle-warden/dist/request-manager";
import { MATCHER_FN } from "./cookie-version-matcher";
import express, { CookieOptions } from "express";
import { IServerOptions } from "./network";

export interface IFragment {
    name: string;
}

export interface IFragmentBFFRender {
    static?: boolean; //todo bunun yenilenen versiyonu
    url: string | string[];
    routeCache?: number;
    selfReplace?: boolean;
    middlewares?: Array<((req: Request, res: Response, next: NextFunction) => any) | string>;
    cacheControl?: string;
    placeholder?: boolean;
    error?: boolean;
    timeout?: number;
}

export interface IFragmentHandler {
    content: (req: object, data?: any) => {
        main: string;
        [name: string]: string;
    };
    placeholder: () => string;
    error: () => {
        main: string
    };
    data: (req: object, res: object) => Promise<HandlerDataResponse>;
}

export interface HandlerDataResponse {
    [name: string]: any;

    data?: any;
    $status?: number;
    $headers?: {
        [name: string]: string
    };
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
    fileName?: string;
    link?: string;
    loadMethod: RESOURCE_LOADING_TYPE;
    type: RESOURCE_TYPE;
    name: string;
    dependent?: string[];
}

export interface IFileResourceStorefrontDependency extends IFileResource {
    loadMethod?: RESOURCE_LOADING_TYPE;
    executeType?: RESOURCE_JS_EXECUTE_TYPE | RESOURCE_CSS_EXECUTE_TYPE;
    content?: string;
    link?: string;
}

export interface IFragmentBFFVersion {
    assets: IFileResourceAsset[];
    dependencies: IFileResourceDependency[];
    handler?: IFragmentHandler;
}

export interface IFragmentBFF extends IFragment {
    prg?: boolean;
    versions: {
        [version: string]: IFragmentBFFVersion
    };
    version: string;
    versionMatcher?: MATCHER_FN;
    testCookie: string;
    warden?: RouteConfiguration;
    render: IFragmentBFFRender;
    folderPath?: string;
}


export interface IExposeFragment {
    version: string;
    versionMatcher?: string;
    testCookie: string;
    render: IFragmentBFFRender;
    prg?: boolean;
    warden?: RouteConfiguration;
    assets: IFileResourceAsset[];
    dependencies: IFileResourceDependency[];
    passiveVersions?: {
        [version: string]: {
            assets: IFileResourceAsset[],
            dependencies: IFileResourceDependency[]
        }
    };
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

export type IFragmentEndpointHandler = (req: any, res: any, next?: any) => void;

export interface IApiHandler {
    path: string;
    middlewares: Array<((req: Request, res: Response, next: NextFunction) => void) | string>;
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
    versionMatcher?: MATCHER_FN;
    versions: { [version: string]: IApiVersion };
}

export interface IGatewayBFFConfiguration extends IGatewayConfiguration {
    fragments: IFragmentBFF[];
    api: IApiConfig[];
    serverOptions: IServerOptions;
    isMobile?: boolean;
    authToken?: string;
    fragmentsFolder: string;
    corsDomains?: string[];
    corsMaxAge?: number;
    customHeaders?: ICustomHeader[];
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

export interface IHttpCookie {
    value: string;
    options: CookieOptions;
}

export interface IHttpCookieMap {
    [key: string]: IHttpCookie;
}

export interface IFragmentContentResponse {
    status: number;
    html: {
        [name: string]: string;
    };
    headers: {
        [name: string]: string;
    };
    cookies: IHttpCookieMap;
    model: FragmentModel;
}

export interface IPageDependentGateways {
    gateways: {
        [name: string]: {
            gateway: GatewayStorefrontInstance | null,
            ready: boolean,
            fragments: {
                [name: string]: {
                    instance: FragmentStorefront,
                    gateway: string
                }
            };
        },
    };
}

export interface IPageConfiguration {
    html: string;
    url: string | string[];
    name: string;
    condition?: (req: express.Request) => boolean;
    intersectionObserverOptions?: IntersectionObserverInit;
    fragments?: Record<string, FragmentSentryConfig>;
}

export interface IStorefrontConfig {
    gateways: IGatewayConfiguration[];
    serverOptions: IServerOptions;
    authToken?: string;
    pages: IPageConfiguration[];
    pollInterval?: number;
    satisfyUpdateCount?: number;
    dependencies: IFileResourceStorefrontDependency[];
    customHeaders?: ICustomHeader[];
}

export interface IResponseHandlers {
    [versionsHash: string]: IFragmentEndpointHandler;
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
    fragment: FragmentStorefront;
    replaceItems: IReplaceAssetSet[];
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
    cookies: IHttpCookieMap;
}

export interface IApiHandlerModule {
    [controller: string]: (req: object, res: object) => any;
}

export interface IWrappingJsAsset {
    injectType: RESOURCE_INJECT_TYPE;
    name: string;
    link: string | null | undefined;
    content: string | null | undefined;
    executeType: RESOURCE_JS_EXECUTE_TYPE | RESOURCE_CSS_EXECUTE_TYPE;
}

export interface IFragmentResponse {
    content: HandlerDataResponse;
    $status: number;
    $headers: {
        [name: string]: string;
    };
    $model: FragmentModel;
}

export interface FragmentModel {
    [name: string]: any;
}

export interface ICustomHeader {
    key: string;
    isEnv?: boolean;
    value: string | number;
}

export interface SatisfyUpdateMap {
    count: number;
    hash: string | null;
}


