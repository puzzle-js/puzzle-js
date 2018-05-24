import "./base";
import {GatewayBFF} from "./gatewayBff";
import {Storefront} from "./storefront";
import {logger} from "./logger";
import {
    FRAGMENT_RENDER_MODES, HTTP_METHODS,
    REPLACE_ITEM_TYPE,
    RESOURCE_INJECT_TYPE,
    RESOURCE_LOCATION,
    RESOURCE_TYPE,
    HTTP_STATUS_CODE
} from "./enums";


export = {
    Gateway: GatewayBFF,
    Storefront,
    logger,
    ENUMS: {
        FRAGMENT_RENDER_MODES,
        RESOURCE_INJECT_TYPE,
        RESOURCE_TYPE,
        RESOURCE_LOCATION,
        REPLACE_ITEM_TYPE,
        HTTP_METHODS,
        HTTP_STATUS_CODE
    }
};
