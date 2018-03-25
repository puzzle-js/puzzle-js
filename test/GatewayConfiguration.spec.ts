import "mocha";
import "chai";

import {GatewayConfiguration} from "../lib/GatewayConfiguration";

describe('', () => {
    it('should create new configuration', function () {
        const gatewayConfiguration = new GatewayConfiguration({
            fragments: 'test'
        });
    });
});