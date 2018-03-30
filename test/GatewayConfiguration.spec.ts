import "mocha";
import {expect} from "chai";

import {GatewayConfiguration} from "../lib/gatewayConfiguration";

describe('', () => {
    it('should create new configuration', function () {
        const gatewayConfiguration = new GatewayConfiguration({
            fragments: [
                {
                    name: 'test'
                }
            ]
        });

        console.log(gatewayConfiguration);
        expect(gatewayConfiguration.fragments[0].name).to.eq('test');
    });
});