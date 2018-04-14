import {Template} from "./template";
import {GatewayStorefrontInstance} from "./gateway";
import {EVENTS} from "./enums";
import {IGatewayMap} from "../types/gateway";
import {IfragmentCookieMap, IPageDependentGateways, IResponseHandlers} from "../types/page";
import {ICookieObject} from "../types/common";

export class Page {
    public ready: boolean = false;
    public gatewayDependencies: IPageDependentGateways;
    public responseHandlers: IResponseHandlers = {};
    private template: Template;
    private fragmentCookieList: Array<IfragmentCookieMap> = [];


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

        //todo if all already ready change page to ready
    }

    public async handle(req: { cookies: ICookieObject }, res: object) {
        const handlerVersion = this.getHandlerVersion(req);
        if (!this.responseHandlers[handlerVersion]) {
            this.responseHandlers[handlerVersion] = await this.template.compile(req.cookies);
        }
        this.responseHandlers[handlerVersion](req, res);
    }

    private getHandlerVersion(req: { cookies: ICookieObject }){
        const fragmentHandlerVersion = this.fragmentCookieList.reduce((fragmentHandlerVersion, fragmentCookie) => {
            fragmentHandlerVersion += `{${fragmentCookie.name}_${req.cookies[fragmentCookie.name] || fragmentCookie.live}}`;
            return fragmentHandlerVersion;
        }, '');

        return fragmentHandlerVersion;
    }

    private getFragmentTestCookieList(){
        const cookieList: IfragmentCookieMap[] = [];
        Object.values(this.gatewayDependencies.fragments).forEach(fragment => {
            if(fragment.instance.config){
                cookieList.push({
                    name: fragment.instance.config.testCookie,
                    live: fragment.instance.config.version
                });
            }
        });
        cookieList.sort();
        return cookieList;
    }

    private gatewayUpdated(gateway: GatewayStorefrontInstance) {
        //update fragments
        this.responseHandlers = {};
    }

    private gatewayReady(gateway: GatewayStorefrontInstance) {
        this.gatewayDependencies.gateways[gateway.name].ready = true;

        Object.values(this.gatewayDependencies.fragments).forEach(fragment => {
            if (fragment.gateway == gateway.name && gateway.config) {
                fragment.instance.update(gateway.config.fragments[fragment.instance.name]);
            }
        });

        if(Object.keys(this.gatewayDependencies.gateways).filter(gatewayName => this.gatewayDependencies.gateways[gatewayName].ready == false).length === 0){
            this.fragmentCookieList = this.getFragmentTestCookieList();
            this.ready = true;
        }
    }
}

