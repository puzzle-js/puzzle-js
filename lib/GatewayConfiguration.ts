export interface GatewayConfigurationValue {
    fragments: string;
}

export class GatewayConfiguration {
    constructor(config: GatewayConfigurationValue){
        console.log(config);
    }
}