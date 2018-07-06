import {container} from "./base";
import {GatewayBFF} from "./gatewayBFF";
import {Storefront} from "./storefront";
import {Logger} from "./logger";
import {
  FRAGMENT_RENDER_MODES, HTTP_METHODS,
  REPLACE_ITEM_TYPE,
  RESOURCE_INJECT_TYPE,
  RESOURCE_LOCATION,
  HTTP_STATUS_CODE,
  INJECTABLE
} from "./enums";
import {GatewayConfigurator, StorefrontConfigurator} from "./configurator";
import {Container} from "inversify";
import {RESOURCE_TYPE} from "./lib/enums";


export = {
  StorefrontConfigurator,
  GatewayConfigurator,
  Gateway: GatewayBFF,
  Storefront,
  logger: Logger,
  ENUMS: {
    FRAGMENT_RENDER_MODES,
    RESOURCE_INJECT_TYPE,
    RESOURCE_TYPE,
    RESOURCE_LOCATION,
    REPLACE_ITEM_TYPE,
    HTTP_METHODS,
    HTTP_STATUS_CODE,
    INJECTABLE
  },
  container: <Container>container
};
