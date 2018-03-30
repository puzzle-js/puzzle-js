import {IFragment} from "../dist/lib/GatewayConfiguration";
import {Fragment, IFragment} from "./fragment";

export interface GatewayConfigurationValue {
    fragments: Array<IFragment>;
}

export class GatewayConfiguration {
    public fragments: Array<Fragment> = [];
    constructor(config: GatewayConfigurationValue){
        config.fragments.forEach(fragmentConfig => {
            this.fragments.push(new Fragment(fragmentConfig));
        });
    }
}