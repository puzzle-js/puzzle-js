import {Template} from "./template";
import {GatewayStorefrontInstance} from "./gatewayStorefront";
import {EVENTS} from "./enums";
import {ICookieObject, IGatewayMap, IPageDependentGateways, IResponseHandlers} from "./types";
import {DEBUG_INFORMATION, DEBUG_QUERY_NAME} from "./config";
import {container, TYPES} from "./base";
import {Logger} from "./logger";
import express from "express";

const logger = <Logger>container.get(TYPES.Logger);


export class Page {
  ready = false;
  gatewayDependencies: IPageDependentGateways;
  responseHandlers: IResponseHandlers = {};
  private template: Template;
  private rawHtml: string;
  private prgEnabled = false;

  constructor(html: string, gatewayMap: IGatewayMap, public name: string) {
    this.rawHtml = html;
    this.template = new Template(html, this.name);
    this.gatewayDependencies = this.template.getDependencies();

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
    if (!this.responseHandlers[`${handlerVersion}_${isDebug}`]) {
      this.responseHandlers[`${handlerVersion}_${isDebug}`] = this.template.compile(req.cookies, isDebug);
    }

    (await this.responseHandlers[`${handlerVersion}_${isDebug}`])(req, res);
  }

  post(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (this.prgEnabled) {
      res.redirect(303, req.originalUrl);
    } else {
      next();
    }
  }

  async reCompile() {
    const defaultVersion = this.getHandlerVersion();
    this.responseHandlers[`${defaultVersion}_true`] = await this.template.compile({}, true);
    this.responseHandlers[`${defaultVersion}_false`] = await this.template.compile({}, false);
  }

  /**
   * Prepares dependencies and subscribes to events.
   * @param {IGatewayMap} gatewayMap
   */
  private preparePageDependencies(gatewayMap: IGatewayMap) {
    Object.keys(gatewayMap)
      .filter(gatewayName => this.gatewayDependencies.gateways[gatewayMap[gatewayName].name])
      .forEach(gatewayName => {
        gatewayMap[gatewayName].events.on(EVENTS.GATEWAY_UPDATED, this.gatewayUpdated.bind(this));
        this.gatewayDependencies.gateways[gatewayName].gateway = gatewayMap[gatewayName];
        if (!!gatewayMap[gatewayName].config) {
          this.gatewayDependencies.gateways[gatewayName].ready = true;
        } else {
          gatewayMap[gatewayName].events.once(EVENTS.GATEWAY_READY, this.gatewayReady.bind(this));
        }
      });
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
  private getHandlerVersion(cookies: { [key: string]: string } = {}) {
    return Object.values(this.gatewayDependencies.fragments)
      .reduce((key, fragment) => {
        if (!fragment.instance.config) {
          return `${key}_${fragment.instance.name}|0`
        }

        const cookieValue = cookies[fragment.instance.config.testCookie];
        return `${key}_${fragment.instance.name}|${cookieValue || fragment.instance.config.version}`;
      }, '');
  };


  private updatePrgStatus() {
    this.prgEnabled = Object
      .values(this.gatewayDependencies.fragments)
      .some(fragment => !!(fragment.instance.config && fragment.instance.config.prg && fragment.instance.primary))
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
    Object.values(this.gatewayDependencies.fragments).forEach(fragment => {
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

