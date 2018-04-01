import "mocha";
import {expect} from "chai";
import {Gateway, GatewayBFF, IGatewayBFFConfiguration} from "../lib/gateway";

describe('Gateway', () => {
    const commonGatewayConfiguration: IGatewayBFFConfiguration = {
        name: 'Browsing',
        api: [],
        fragments: [],
        isMobile: true,
        port: 4446,
        url: 'http://localhost:4446/'
    };

    it('should create new gateway', function () {
       const gatewayConfiguration = {
           name: 'Browsing',
           url: 'http://localhost:4446/'
       };

       const browsingGateway = new Gateway(gatewayConfiguration);
       expect(browsingGateway.name).to.eq(gatewayConfiguration.name);
       expect(browsingGateway.url).to.eq(gatewayConfiguration.url);
    });

    it('should create new gateway BFF instance', function () {
        const bffGw = new GatewayBFF(commonGatewayConfiguration);
        expect(bffGw).to.be.instanceOf(GatewayBFF);
    });

    it('should create a new gateway bff instance with single fragment', function () {
        const gatewayConfiguration: IGatewayBFFConfiguration = {
            ...commonGatewayConfiguration,
            fragments: [
                {
                    name: 'boutique-list',
                    version: 'test',
                    render: {
                        url: '/'
                    },
                    versions: {
                        'test': {
                            assets: [],
                            dependencies: [],
                            handler: require('./fragments/boutique-list/test')
                        }
                    }
                }
            ]
        };

        const bffGw = new GatewayBFF(gatewayConfiguration);
        expect(bffGw).to.be.instanceOf(GatewayBFF);
    });

    it('should expose public configuration reduced', function () {
        const gatewayConfiguration: IGatewayBFFConfiguration = {
            ...commonGatewayConfiguration,
            fragments: [
                {
                    name: 'boutique-list',
                    version: 'test',
                    render: {
                        url: '/'
                    },
                    versions: {
                        'test': {
                            assets: [],
                            dependencies: [],
                            handler: require('./fragments/boutique-list/test')
                        },
                        'test2': {
                            assets: [],
                            dependencies: [],
                            handler: require('./fragments/boutique-list/test2')
                        }
                    }
                }
            ]
        };

        const bffGw = new GatewayBFF(gatewayConfiguration);

        expect(bffGw.exposedConfig).to.deep.eq({
            hash: 'f74c5ac7e45728d45251fc5286e250d8',
            fragments: {
                'boutique-list': {
                    assets: [],
                    dependencies: [],
                    render: {
                        url: '/'
                    },
                    version: 'test'
                }
            }
        });
    });

    it('should render fragment by name', function () {
        const gatewayConfiguration: IGatewayBFFConfiguration = {
            ...commonGatewayConfiguration,
            fragments: [
                {
                    name: 'boutique-list',
                    version: 'test',
                    render: {
                        url: '/'
                    },
                    versions: {
                        'test': {
                            assets: [],
                            dependencies: [],
                            handler: require('./fragments/boutique-list/test')
                        }
                    }
                }
            ]
        };

        const bffGw = new GatewayBFF(gatewayConfiguration);
        expect(bffGw.renderFragment('boutique-list')).to.eq('test');
    });
});
