import {container} from "./base";
import {GatewayBFF} from "./gatewayBFF";
import {Storefront} from "./storefront";
import {Logger} from "./logger";
import {
    FRAGMENT_RENDER_MODES,
    HTTP_METHODS,
    HTTP_STATUS_CODE,
    RESOURCE_JS_EXECUTE_TYPE,
    RESOURCE_CSS_EXECUTE_TYPE,
    INJECTABLE,
    REPLACE_ITEM_TYPE,
    RESOURCE_INJECT_TYPE
} from "./enums";
import {GatewayConfigurator, StorefrontConfigurator} from "./configurator";
import {Container} from "inversify";
import {RESOURCE_LOADING_TYPE, RESOURCE_TYPE} from "@puzzle-js/client-lib/dist/enums";
import {httpAgent, httpsAgent} from "./client";
import warden from "puzzle-warden";
import { $configuration } from "./configuration";


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
        RESOURCE_JS_EXECUTE_TYPE,
        RESOURCE_CSS_EXECUTE_TYPE,
        REPLACE_ITEM_TYPE,
        HTTP_METHODS,
        HTTP_STATUS_CODE,
        INJECTABLE
    },
    container: container as Container,
    $configuration
};
