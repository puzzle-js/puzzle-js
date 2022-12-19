import {Template} from "./template";
import {GatewayStorefrontInstance} from "./gatewayStorefront";
import {EVENTS, FragmentSentryConfig} from "./enums";
import {
  ICookieMap,
  ICookieObject,
  IFragmentEndpointHandler,
  IGatewayMap,
  IPageDependentGateways,
  IResponseHandlers
} from "./types";
import {DEBUG_INFORMATION, DEBUG_QUERY_NAME} from "./config";
import {FragmentStorefront} from "./fragment";
import express from "express";

export class Page {
  ready = false;
  gatewayDependencies: IPageDependentGateways;
  fragments: Array<{
    instance: FragmentStorefront,
    gateway: string
  }>;
  responseHandlers: IResponseHandlers = {};
  template: Template;
  condition?: (req: express.Request) => false | true;
  name: string;
  private waitingCompilers: { [key: string]: Promise<IFragmentEndpointHandler> } = {};
  private rawHtml: string;
  private prgEnabled = false;
  private fragmentsSentryConfiguration?: Record<string, FragmentSentryConfig>;
  
  cleanUpEvents: () => void;

  constructor(html: string, gatewayMap: IGatewayMap, name: string, condition?: (req: express.Request) => false | true, fragmentsSentryConfiguration?: Record<string, FragmentSentryConfig>, intersectionObserverOptions?: IntersectionObserverInit) {
    this.rawHtml = html;
    this.name = name;

    this.fragmentsSentryConfiguration = fragmentsSentryConfiguration;
    this.condition = condition;
    
    if(typeof intersectionObserverOptions !== "undefined") {
      this.template = new Template(html, this.name, fragmentsSentryConfiguration, intersectionObserverOptions);  
    } else {
      this.template = new Template(html, this.name, fragmentsSentryConfiguration);
    }
    
    this.gatewayDependencies = this.template.getDependencies();
    this.fragments = Object.values(this.gatewayDependencies.gateways)
        .map(gw => Object.values(gw.fragments))
        .reduce((acc, val) => [ ...acc, ...val ], []);

    this.gatewayUpdated = this.gatewayUpdated.bind(this);
    this.gatewayReady = this.gatewayReady.bind(this);

    this.preparePageDependencies(gatewayMap);
    this.checkPageReady();
  }

  /**
   * Request handler, compiles template if not exists
   * @param {{cookies: ICookieObject}} req
   * @param {object} res
   * @returns {Promise<void>}
   */
  async handle(req: { cookies: ICookieObject, query: { [name: string]: string } }, res: object) {
    const isDebug = DEBUG_INFORMATION || (req.query && req.query.hasOwnProperty(DEBUG_QUERY_NAME));
    const handlerVersion = this.getHandlerVersion(req.cookies);
    const compileVersion = `${handlerVersion}_${isDebug}`;

    if (!this.responseHandlers[compileVersion]) {
      const waitedCompileProcess = this.waitingCompilers[compileVersion];
      if (waitedCompileProcess) {
        await waitedCompileProcess;
      } else {
        this.waitingCompilers[compileVersion] = this.template.compile(req.cookies, isDebug);
        await this.waitingCompilers[compileVersion]
          .then(handler => {
            this.responseHandlers[compileVersion] = handler;
          });
      }
    }


    this.responseHandlers[compileVersion](req, res);
  }

  post(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (this.prgEnabled) {
      res.redirect(303, req.originalUrl);
    } else {
      next();
    }
  }

  async reCompile() {
    const defaultVersion = this.getHandlerVersion({}, true);
    this.responseHandlers[`${defaultVersion}_true`] = await this.template.compile({}, true, true);
    this.responseHandlers[`${defaultVersion}_false`] = await this.template.compile({}, false, true);
  }

  /**
   * Prepares dependencies and subscribes to events.
   * @param {IGatewayMap} gatewayMap
   */
  private preparePageDependencies(gatewayMap: IGatewayMap) {

    const cleanUpCodes = Object.keys(gatewayMap)
      .filter(gatewayName => this.gatewayDependencies.gateways[gatewayMap[gatewayName].name])
      .map(gatewayName => {

        gatewayMap[gatewayName].events.on(EVENTS.GATEWAY_UPDATED, this.gatewayUpdated);
        this.gatewayDependencies.gateways[gatewayName].gateway = gatewayMap[gatewayName];
        if (!!gatewayMap[gatewayName].config) {
          this.gatewayDependencies.gateways[gatewayName].ready = true;
          this.updateFragmentsConfig(this.gatewayDependencies.gateways[gatewayName].gateway!);
        } else {
          gatewayMap[gatewayName].events.once(EVENTS.GATEWAY_READY, this.gatewayReady);
        }

        return () => {
          gatewayMap[gatewayName].events.removeListener(EVENTS.GATEWAY_UPDATED, this.gatewayUpdated);
          gatewayMap[gatewayName].events.removeListener(EVENTS.GATEWAY_READY, this.gatewayReady);
        };
      });

    this.cleanUpEvents = () => {
      cleanUpCodes.forEach(cb => cb());
    };
  }


  clean() {
    this.cleanUpEvents();
  }

  /**
   * Checks for page dependencies are ready
   */
  private checkPageReady(): void {
    if (Object.keys(this.gatewayDependencies.gateways).filter(gatewayName => !this.gatewayDependencies.gateways[gatewayName].ready).length === 0) {
      this.ready = true;
    }
  }

  /**
   * Based on test cookies returns handler key
   * @returns {string}
   * @param query
   * @param cookies
   */
  private getHandlerVersion(cookies: ICookieMap, preCompile = false) {
    return this.fragments
      .reduce((key, fragment) => {
        return `${key}_${fragment.instance.name}|${fragment.instance.detectVersion(cookies, preCompile)}`;
      }, '');
  }


  private updatePrgStatus() {
    this.prgEnabled = this.fragments
      .some(fragment => !!(fragment.instance.config && fragment.instance.config.prg && fragment.instance.primary));
  }


  /**
   * Called on GATEWAY_UPDATED
   * @param {GatewayStorefrontInstance} gateway
   */
  private gatewayUpdated(gateway: GatewayStorefrontInstance) {
    this.updateFragmentsConfig(gateway);
    this.template.load();
    this.updatePrgStatus();
    this.reCompile();
  }

  /**
   * Updates fragment config based on gateway configuration
   * @param {GatewayStorefrontInstance} gateway
   */
  private updateFragmentsConfig(gateway: GatewayStorefrontInstance) {
    this.fragments.forEach(fragment => {
      if (fragment.gateway === gateway.name && gateway.config) {
        fragment.instance.update(gateway.config.fragments[fragment.instance.name], gateway.url, gateway.name, gateway.assetUrl);
      }
    });
  }

  /**
   * Called on GATEWAY_READY
   * @param {GatewayStorefrontInstance} gateway
   */
  private gatewayReady(gateway: GatewayStorefrontInstance) {
    this.gatewayDependencies.gateways[gateway.name].ready = true;
    this.updateFragmentsConfig(gateway);
    this.updatePrgStatus();
    this.checkPageReady();
  }
}

