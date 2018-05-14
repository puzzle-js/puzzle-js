//Unit Tests
import fragmentTests from "./fragment.spec";
import gatewayTests from "./gateway.spec";
import pageTests from "./page.spec";
import resourceTest from "./resource.spec";
import storefrontTests from "./storefront.spec";
import templateTests from "./template.spec";
import serverTests from "./server.spec";
import apiTest from "./api.spec";


//Integration Tests
import bffIntegrationTests from "./integration/bff.spec";
import storefrontIntegrationTests from "./integration/sf.spec";


describe('Unit Tests', () => {
    fragmentTests();
    gatewayTests();
    pageTests();
    resourceTest();
    storefrontTests();
    templateTests();
    serverTests();
    apiTest();
});

describe('Integration', () => {
    bffIntegrationTests();
    storefrontIntegrationTests();
});
