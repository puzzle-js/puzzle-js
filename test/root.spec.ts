import fragmentTests from "./fragment.spec";
import gatewayTests from "./gateway.spec";
import pageTests from "./page.spec";
import resourceTest from "./resource.spec";
import storefrontTests from "./storefront.spec";
import templateTests from "./template.spec";
import serverTests from "./server.spec";
import bffIntegrationTests from "./integration/bff.spec";

describe('Unit Tests', () => {
    fragmentTests();
    gatewayTests();
    pageTests();
    resourceTest();
    storefrontTests();
    templateTests();
    serverTests();
});

describe('Integration', () => {
    bffIntegrationTests();
});
