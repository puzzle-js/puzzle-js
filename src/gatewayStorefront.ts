import {EventEmitter} from "events";
import {EVENTS} from "./enums";
import fetch from "node-fetch";
import {DEFAULT_POLLING_INTERVAL} from "./config";
import {Logger} from "./logger";
import {IExposeConfig, IGatewayConfiguration} from "./types";
import Timer = NodeJS.Timer;
import {container, TYPES} from "./base";
import {HttpClient} from "./client";
import warden from "puzzle-warden";

const logger = <Logger>container.get(TYPES.Logger);
const httpClient = <HttpClient>container.get(TYPES.Client);

export class GatewayStorefrontInstance {
  events: EventEmitter = new EventEmitter();
  config: IExposeConfig | undefined;
  assetUrl: string | undefined;
  name: string;
  url: string;
  private intervalId: Timer | null | number = null;

  constructor(gatewayConfig: IGatewayConfiguration) {
    this.name = gatewayConfig.name;
    this.url = gatewayConfig.url;
    httpClient.init('PuzzleJs Storefront');

    this.assetUrl = gatewayConfig.assetUrl;

    this.fetch();
  }

  /**
   * Starts updating gateway by polling with the provided miliseconds
   * @param {number} pollingInterval
   */
  startUpdating(pollingInterval: number = DEFAULT_POLLING_INTERVAL) {
    this.intervalId = setInterval(this.fetch.bind(this), pollingInterval);
  }

  /**
   * Stops polling
   */
  stopUpdating() {
    if (this.intervalId) {
      clearInterval(this.intervalId as Timer);
    }
  }

  /**
   * Fetches gateway condifuration and calls this.bind
   */
  private async fetch() {
    try {
      const res = await fetch(this.url, {
        headers: {
          gateway: this.name
        }
      });
      const json = await res.json();
      this.update(json);
    } catch (e) {
      logger.error(`Failed to fetch gateway configuration: ${this.name}`, e);
    }
  }

  /**
   * Updates gateway configuration and if hash changed emits GATEWAY_UPDATED event
   * @param {IExposeConfig} data
   */
  private update(data: IExposeConfig) {
    if (!this.config) {
      logger.info(`Gateway is ready: ${this.name}`);
      this.config = data;
      this.events.emit(EVENTS.GATEWAY_READY, this);
      this.connectWarden(data);
    } else {
      if (data.hash !== this.config.hash) {
        logger.info(`Gateway is updated: ${this.name}`);
        this.config = data;
        this.events.emit(EVENTS.GATEWAY_UPDATED, this);
        this.connectWarden(data);
      }
    }
  }

  private connectWarden(data: IExposeConfig) {
    for (const key in data.fragments) {
      const fragment = data.fragments[key];
      if (fragment.warden && fragment.warden.identifier) {
        warden.register(key, fragment.warden);
      } else {
        warden.unregisterRoute(key);
      }
    }
  }
}

