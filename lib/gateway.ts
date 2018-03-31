import md5 from "md5";
import {EventEmitter} from "events";

export interface GatewayConfiguration {
    name: string;
    url: string;
}

export interface GatewayBFFConfiguration extends GatewayConfiguration {

}

export class Gateway {
    public name: string;
    public url: string;

    constructor(gatewayConfig: GatewayConfiguration) {
        this.name = gatewayConfig.name;
        this.url = gatewayConfig.url;
    }
}


export class GatewayStorefrontInstance extends Gateway {
    private eventBus: EventEmitter;
    constructor(gatewayConfig: GatewayConfiguration, eventBus: EventEmitter) {
        super(gatewayConfig);

        this.eventBus = eventBus;
    }
}

export class GatewayBFF extends Gateway {
    public config: GatewayBFFConfiguration;
    public hash: string;

    constructor(gatewayConfig: GatewayBFFConfiguration) {
        super(gatewayConfig);

        this.config = gatewayConfig;
        this.hash = md5(JSON.stringify(gatewayConfig));
    }

    public exposeConfig (){

    }
}
