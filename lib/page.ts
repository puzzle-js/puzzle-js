import {Template} from "./template";
import {GatewayStorefrontInstance, IGatewayMap} from "./gateway";
import {EVENTS} from "./enums";
import {FragmentStorefront} from "./fragment";

export interface IPageConfiguration {
    html: string,
    url: string
}

export interface IPageMap {
    [url: string]: Page;
}

export interface IPageDependentGateways {
    gateways: {
        [name: string]: {
            gateway: GatewayStorefrontInstance | null,
            ready: boolean
        }
    },
    fragments: {
        [name: string]: {
            instance: FragmentStorefront,
            gateway: string
        }
    }
}

export interface IResponseHandlers {
    [versionsHash: string]: (req: object, res: object) => void;
}

export class Page {
    public ready: boolean = false;
    private template: Template;
    private gatewayDependencies: IPageDependentGateways;
    private responseHandlers: IResponseHandlers = {};

    constructor(html: string, gatewayMap: IGatewayMap) {
        this.template = new Template(html);
        this.gatewayDependencies = this.template.getDependencies();

        Object.keys(gatewayMap)
            .filter(gatewayName => this.gatewayDependencies.gateways[gatewayMap[gatewayName].name])
            .forEach(gatewayName => {
                gatewayMap[gatewayName].events.on(EVENTS.GATEWAY_UPDATED, this.gatewayUpdated.bind(this));
                gatewayMap[gatewayName].events.once(EVENTS.GATEWAY_READY, this.gatewayReady.bind(this))
            });
    }

    private gatewayUpdated() {
        this.responseHandlers = {};
    }

    private gatewayReady(gateway: GatewayStorefrontInstance) {
        this.gatewayDependencies.gateways[gateway.name].ready = true;
        this.gatewayDependencies.gateways[gateway.name].gateway = gateway;
        Object.keys(this.gatewayDependencies.fragments).forEach(fragmentName => {
            if (this.gatewayDependencies.fragments[fragmentName].gateway == gateway.name && gateway.config) {
                this.gatewayDependencies.fragments[fragmentName].instance.update(gateway.config.fragments[fragmentName]);
            }
        });
    }

    public async handle(req: object, res: object) {
        const preparedFragmentVersionsHash = "blabla";

        if (!this.responseHandlers[preparedFragmentVersionsHash]) {
            this.responseHandlers[preparedFragmentVersionsHash] = await this.template.compile();
        }
        this.responseHandlers[preparedFragmentVersionsHash](req, res);
    }
}

