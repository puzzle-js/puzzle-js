import {container} from "./base";
import {GatewayBFF} from "./gatewayBFF";
import {Storefront} from "./storefront";
import {Logger} from "./logger";
import {
    FRAGMENT_RENDER_MODES,
    HTTP_METHODS,
    HTTP_STATUS_CODE,
    INJECTABLE,
    REPLACE_ITEM_TYPE,
    RESOURCE_INJECT_TYPE
} from "./enums";
import {GatewayConfigurator, StorefrontConfigurator} from "./configurator";
import {Container} from "inversify";
import {RESOURCE_LOADING_TYPE, RESOURCE_TYPE} from "./lib/enums";
import "base";
import {httpAgent, httpsAgent} from "./client";
import warden from "puzzle-warden";


export = {
    StorefrontConfigurator,
    GatewayConfigurator,
    Gateway: GatewayBFF,
    warden,
    Storefront,
    logger: Logger,
    agents: {
        httpAgent,
        httpsAgent
    },
    ENUMS: {
        FRAGMENT_RENDER_MODES,
        RESOURCE_INJECT_TYPE,
        RESOURCE_TYPE,
        RESOURCE_LOADING_TYPE,
        REPLACE_ITEM_TYPE,
        HTTP_METHODS,
        HTTP_STATUS_CODE,
        INJECTABLE
    },
    container: container as Container
};
