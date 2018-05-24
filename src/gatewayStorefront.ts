import {EventEmitter} from "events";
import {EVENTS} from "./enums";
import fetch from "node-fetch";
import {DEFAULT_POLLING_INTERVAL} from "./config";
import {logger} from "./logger";
import {IExposeConfig, IGatewayConfiguration} from "./types";
import Timer = NodeJS.Timer;

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
     * Stops udpating gateway
     */
    stopUpdating() {
        if (this.intervalId) {
            clearInterval(this.intervalId as Timer);
        }
    }

    /**
     * Fetches gateway condifuration and calls this.bind
     */
    private fetch() {
        fetch(this.url)
            .then(res => res.json())
            .then(this.update.bind(this))
            .catch(e => {
                console.error(`Failed to fetch gateway configuration: ${this.name}`);
                //todo error handling
                //console.error(e)
            });
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
        } else {
            if (data.hash !== this.config.hash) {
                logger.info(`Gateway is updated: ${this.name}`);
                this.config = data;
                this.events.emit(EVENTS.GATEWAY_UPDATED, this);
            }
        }
    }
}

