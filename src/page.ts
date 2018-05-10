import {Template} from "./template";
import {GatewayStorefrontInstance, IGatewayMap} from "./gateway";
import {EVENTS} from "./enums";
import {FragmentStorefront, IFragmentCookieMap} from "./fragment";

export interface ICookieObject {
    [name: string]: string;
}

export interface IFragmentContentResponse {
    status: number;
    html: {
        [name: string]: string;
    };
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

export interface IPageConfiguration {
    html: string;
    url: string;
}

export interface IPageMap {
    [url: string]: Page;
}

export interface IResponseHandlers {
    [versionsHash: string]: (req: object, res: object) => void;
}

export class Page {
    ready = false;
    gatewayDependencies: IPageDependentGateways;
    responseHandlers: IResponseHandlers = {};
    private template: Template;
    private fragmentCookieList: IFragmentCookieMap[] = [];

    constructor(html: string, gatewayMap: IGatewayMap) {
        this.template = new Template(html);
        this.gatewayDependencies = this.template.getDependencies();

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

        this.checkPageReady();
    }

    /**
     * Creates new handler for request or uses existing. Puzzle - Express first contact.
     * @param {{cookies: ICookieObject}} req
     * @param {object} res
     * @returns {Promise<void>}
     */
    async handle(req: { cookies: ICookieObject }, res: object) {
        const handlerVersion = this.getHandlerVersion(req);
        if (!this.responseHandlers[handlerVersion]) {
            this.responseHandlers[handlerVersion] = await this.template.compile(req.cookies);
        }
        this.responseHandlers[handlerVersion](req, res);
    }

    /**
     * Checks if all pages are ready and sets this.ready to true
     */
    private checkPageReady(): void {
        if (Object.keys(this.gatewayDependencies.gateways).filter(gatewayName => this.gatewayDependencies.gateways[gatewayName].ready === false).length === 0) {
            this.fragmentCookieList = this.getFragmentTestCookieList();
            this.ready = true;
        }
    }

    /**
     * Creates handler key for requested page
     * @param {{cookies: ICookieObject}} req
     * @returns {string}
     */
    private getHandlerVersion(req: { cookies: ICookieObject }) {
        return this.fragmentCookieList.reduce((fragmentHandlerVersion, fragmentCookie) => {
            fragmentHandlerVersion += `{${fragmentCookie.name}_${req.cookies[fragmentCookie.name] || fragmentCookie.live}}`;
            return fragmentHandlerVersion;
        }, '');
    }

    /**
     * Fragments test cookie list
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
     * Callback for gateway updates
     * @param {GatewayStorefrontInstance} gateway
     */
    private gatewayUpdated(gateway: GatewayStorefrontInstance) {
        this.updateFragmentsConfig(gateway);
        this.responseHandlers = {};
    }

    /**
     * Updates updates gateways fragments.
     * @param {GatewayStorefrontInstance} gateway
     */
    private updateFragmentsConfig(gateway: GatewayStorefrontInstance) {
        Object.values(this.gatewayDependencies.fragments).forEach(fragment => {
            if (fragment.gateway === gateway.name && gateway.config) {
                fragment.instance.update(gateway.config.fragments[fragment.instance.name], gateway.url);
            }
        });
    }

    /**
     * Event for gateway ready status
     * @param {GatewayStorefrontInstance} gateway
     */
    private gatewayReady(gateway: GatewayStorefrontInstance) {
        this.gatewayDependencies.gateways[gateway.name].ready = true;
        this.updateFragmentsConfig(gateway);

        this.checkPageReady();
    }
}

