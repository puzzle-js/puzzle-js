import "mocha";
import {expect} from "chai";
import {Gateway} from "../lib/gateway";

describe('', () => {
    it('should create new gateway', function () {
       const gatewayConfiguration = {
           name: 'Browsing',
           url: 'http://localhost:4446/'
       };

       const browsingGateway = new Gateway(gatewayConfiguration);
       expect(browsingGateway.name).to.eq(gatewayConfiguration.name);
       expect(browsingGateway.url).to.eq(gatewayConfiguration.url);
    });
});
