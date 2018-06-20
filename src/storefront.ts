import {GatewayStorefrontInstance} from "./gatewayStorefront";
import {Page} from "./page";
import async from "async";
import {EVENTS, HEALTHCHECK_PATH, HTTP_METHODS, HTTP_STATUS_CODE} from "./enums";
import {wait} from "./util";
import {Logger} from "./logger";
import {EventEmitter} from "events";
import {callableOnce, sealed} from "./decorators";
import {container, TYPES} from "./base";
import {Server} from "./server";
import {IGatewayMap, IPageMap, IStorefrontConfig} from "./types";
import ResourceFactory from "./resourceFactory";
import {GATEWAY_PREPERATION_CHECK_INTERVAL, PUZZLE_DEBUGGER_LINK} from "./config";
import {StorefrontConfigurator} from "./configurator";
import path from "path";

const logger = <Logger>container.get(TYPES.Logger);


@sealed
export class Storefront {
  server: Server;
  events: EventEmitter = new EventEmitter();
  config: IStorefrontConfig;
  pages: IPageMap = {};
  gateways: IGatewayMap = {};
  private gatewaysReady = 0;


  /**
   * Storefront Instance
   * @param {IStorefrontConfig} storefrontConfig
   * @param {Server} _server
   */
  constructor(storefrontConfig: IStorefrontConfig | StorefrontConfigurator, _server?: Server) {
    this.server = _server || container.get(TYPES.Server);

    if (storefrontConfig instanceof StorefrontConfigurator) {
      this.config = storefrontConfig.configuration;
    } else {
      this.config = storefrontConfig;
    }

    this.bootstrap();
  }

  /**
   * Starts storefront instance
   * @param {Function} cb
   */
  @callableOnce
  public init(cb?: Function) {
    async.series([
      this.registerDependencies.bind(this),
      this.waitForGateways.bind(this),
      this.registerDebugScripts.bind(this),
      this.addPageRoute.bind(this),
      this.addHealthCheckRoute.bind(this)
    ], err => {
      if (!err) {
        this.server.listen(this.config.port, () => {
          logger.info(`Storefront is listening on port ${this.config.port}`);
          cb && cb();
        });
      } else {
        throw err;
      }
    });
  }

  private bootstrap() {
    this.server.useProtocolOptions(this.config.spdy);
    this.createStorefrontPagesAndGateways();
  }

  /**
   * Creates static routes for debugging scripts
   * @param {Function} cb
   * @returns {Promise<void>}
   */
  private async registerDebugScripts(cb: Function) {
    this.server.addRoute(PUZZLE_DEBUGGER_LINK, HTTP_METHODS.GET, (req, res) => {
      res.sendFile(path.join(__dirname, './public/puzzle_debug.js'));
    });

    cb(null);
  }

  /**
   * Waits for gateways to be prepared
   * @param {Function} cb
   * @returns {Promise<void>}
   */
  private async waitForGateways(cb: Function) {
    while (Object.keys(this.gateways).length != this.gatewaysReady) {
      await wait(GATEWAY_PREPERATION_CHECK_INTERVAL);
    }
    cb(null);
  }

  /**
   * Creates gateway pages, pages and subscribes event to gateways to track ready status
   */
  private createStorefrontPagesAndGateways() {
    this.config.gateways.forEach(gatewayConfiguration => {
      const gateway = new GatewayStorefrontInstance(gatewayConfiguration);
      gateway.events.once(EVENTS.GATEWAY_READY, () => {
        this.gatewaysReady++;
      });
      gateway.startUpdating();
      this.gateways[gatewayConfiguration.name] = gateway;
    });

    this.config.pages.forEach(pageConfiguration => {
      this.pages[pageConfiguration.url.toString()] = new Page(pageConfiguration.html, this.gateways);
    });
  }

  /**
   * Registers provided dependencies in storefront configuration
   * @param {Function} cb
   */
  private registerDependencies(cb: Function) {
    this.config.dependencies.forEach(dependency => {
      ResourceFactory.instance.registerDependencies(dependency);
    });

    cb();
  }

  /**
   * Adds healthcheck route.
   * @param {Function} cb
   */
  private addHealthCheckRoute(cb: Function) {
    this.server.addRoute(HEALTHCHECK_PATH, HTTP_METHODS.GET, (req, res) => {
      res.status(HTTP_STATUS_CODE.OK).end();
    });

    cb();
  }

  /**
   * Adds page routes then connects with page instance responsible for it.
   * @param {Function} cb
   */
  private addPageRoute(cb: Function) {
    this.config.pages.forEach(page => {
      const targetPage = page.url.toString();
      this.server.addRoute(page.url, HTTP_METHODS.GET, (req, res) => {
        this.pages[targetPage].handle(req, res);
      });
    });

    cb();
  }
}
