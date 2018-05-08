import "mocha";
import {expect} from "chai";
import {GatewayBFF} from "../../src/lib/gateway";

export default () => {
    describe('BFF', () => {
        it('should create new gateway instance', () => {
            const bff = new GatewayBFF({
                api: [],
                fragments: [],
                name: 'Browsing',
                url: 'http://localhost:0644/',
                port: 4446
            });

            expect(bff).to.be.instanceOf(GatewayBFF);
        });
    });
}
