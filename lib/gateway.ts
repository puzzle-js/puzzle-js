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
    constructor(gatewayConfig: GatewayConfiguration) {
        super(gatewayConfig);
    }
}

export class GatewayBFF extends Gateway {
    constructor(gatewayConfig: GatewayBFFConfiguration) {
        super(gatewayConfig);
    }

    exposeConfig (){
        //put hash object here
    }
}
