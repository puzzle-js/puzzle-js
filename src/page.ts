import {Template} from "./template";
import {GatewayStorefrontInstance} from "./gatewayStorefront";
import {EVENTS} from "./enums";
import {ICookieObject, IFragmentCookieMap, IGatewayMap, IPageDependentGateways, IResponseHandlers} from "./types";
import {DEBUG_INFORMATION, DEBUG_QUERY_NAME} from "./config";

export class Page {
  ready = false;
  gatewayDependencies: IPageDependentGateways;
  responseHandlers: IResponseHandlers = {};
  private template: Template;
  private rawHtml: string;
  private fragmentCookieList: IFragmentCookieMap[] = [];

  constructor(html: string, gatewayMap: IGatewayMap, private name: string) {
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
    const handlerVersion = this.getHandlerVersion(req);
    const isDebug = DEBUG_INFORMATION || (req.query && req.query.hasOwnProperty(DEBUG_QUERY_NAME));
    if (!this.responseHandlers[handlerVersion]) {
      console.log('--------------');
      console.log("PAGE", this.name);
      console.trace();
      console.log('--------------');
      this.template.load();
      this.responseHandlers[handlerVersion] = await this.template.compile(req.cookies, isDebug);
    }
    
    this.responseHandlers[handlerVersion](req, res);
  }

  async preLoad() {
    this.template.load();
    this.responseHandlers['__preLoad'] = await this.template.compile({}, false);
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
    if (Object.keys(this.gatewayDependencies.gateways).filter(gatewayName => this.gatewayDependencies.gateways[gatewayName].ready === false).length === 0) {
      this.fragmentCookieList = this.getFragmentTestCookieList();
      this.ready = true;
    }
  }

  /**
   * Based on test cookies returns handler key
   * @param {{cookies: ICookieObject}} req
   * @returns {string}
   */
  private getHandlerVersion(req: { cookies: ICookieObject, query: { [name: string]: string } }) {
    let fragmentCookieVersion = this.fragmentCookieList.reduce((fragmentHandlerVersion, fragmentCookie) => {
      fragmentHandlerVersion += `{${fragmentCookie.name}_${req.cookies[fragmentCookie.name] || fragmentCookie.live}}`;
      return fragmentHandlerVersion;
    }, '');

    if (req.query && req.query[DEBUG_QUERY_NAME]) {
      fragmentCookieVersion += DEBUG_QUERY_NAME;
    }

    return fragmentCookieVersion;
  }

  /**
   * Returns test cookie list from all fragments
   * @returns {IFragmentCookieMap[]}
   */
  private getFragmentTestCookieList() {
    const cookieList: IFragmentCookieMap[] = [];
    Object.values(this.gatewayDependencies.fragments).forEach(fragment => {
      if (fragment.instance.config) {
        cookieList.push({
          name: fragment.instance.config.testCookie,
          live: fragment.instance.config.version
        });
      }
    });
    cookieList.sort();
    return cookieList;
  }


  /**
   * Called on GATEWAY_UPDATED
   * @param {GatewayStorefrontInstance} gateway
   */
  private gatewayUpdated(gateway: GatewayStorefrontInstance) {
    this.updateFragmentsConfig(gateway);
    this.template.load();
    this.responseHandlers = {};
  }

  /**
   * Updates fragment config based on gateway configuration
   * @param {GatewayStorefrontInstance} gateway
   */
  private updateFragmentsConfig(gateway: GatewayStorefrontInstance) {
    Object.values(this.gatewayDependencies.fragments).forEach(fragment => {
      if (fragment.gateway === gateway.name && gateway.config) {
        fragment.instance.update(gateway.config.fragments[fragment.instance.name], gateway.url, gateway.assetUrl);
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

    this.checkPageReady();
  }
}

