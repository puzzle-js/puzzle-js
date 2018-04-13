import "mocha";
import {expect} from "chai";
import {Gateway, GatewayBFF, GatewayStorefrontInstance} from "../src/lib/gateway";
import {EVENTS, FRAGMENT_RENDER_MODES} from "../src/lib/enums";
import {IExposeConfig, IGatewayBFFConfiguration, IGatewayConfiguration} from "../src/types/gateway";
import nock from "nock";
import {createGateway} from "./mock/mock";

describe('Gateway', () => {
    describe('BFF', () => {
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
                        testCookie: 'fragment_test',
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
                        testCookie: 'fragment_test',
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

            expect(bffGw.exposedConfig).to.deep.include({
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
            expect(bffGw.exposedConfig.hash).to.be.a('string');
        });

        it('should render fragment in stream mode', async function () {
            const gatewayConfiguration: IGatewayBFFConfiguration = {
                ...commonGatewayConfiguration,
                fragments: [
                    {
                        name: 'boutique-list',
                        version: 'test',
                        render: {
                            url: '/'
                        },
                        testCookie: 'fragment_test',
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
            expect(await bffGw.renderFragment('boutique-list', FRAGMENT_RENDER_MODES.STREAM)).to.eq('test');
        });

        it('should render fragment in preview mode', async function () {
            const gatewayConfiguration: IGatewayBFFConfiguration = {
                ...commonGatewayConfiguration,
                fragments: [
                    {
                        name: 'boutique-list',
                        version: 'test',
                        render: {
                            url: '/'
                        },
                        testCookie: 'fragment_test',
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
            expect(await bffGw.renderFragment('boutique-list', FRAGMENT_RENDER_MODES.PREVIEW)).to.eq(`<html><head><title>Browsing - boutique-list</title><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /></head><body>test</body></html>`);
        });

        it('should throw error at render when fragment name not found', function (done) {
            const gatewayConfiguration: IGatewayBFFConfiguration = {
                ...commonGatewayConfiguration,
                fragments: [
                    {
                        name: 'boutique-list',
                        version: 'test',
                        render: {
                            url: '/'
                        },
                        testCookie: 'fragment_test',
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
            bffGw.renderFragment('not_exists').then(data => done(data)).catch((e) => {
                expect(e.message).to.include('Failed to find fragment');
                done();
            });
        });
    });

    describe('Storefront', () => {
        const commonGatewayStorefrontConfiguration = {
            name: 'Browsing',
            url: 'http://browsing-gw.com',
            config: {
                hash: '44',
                fragments: {
                    test: {
                        version: '1.0.0',
                        render: {
                            url: '/'
                        },
                        assets: [],
                        dependencies: []
                    }
                }
            }
        };
        let interceptor: nock.Scope | null = null;

        before(() => {
            interceptor = createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
        });

        after(() => {
            interceptor && interceptor.persist(false);
        });

        it('should create a new gateway storefront instance', function () {
            const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);

            expect(gateway).to.be.instanceOf(GatewayStorefrontInstance);
            gateway.stopUpdate();
        });

        it('should load remote configuration successfully and fire ready event', function (done) {
            const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);

            gateway.events.on(EVENTS.GATEWAY_READY, () => {
                gateway.stopUpdate();
                done();
            });
        });

        it('should fire gateway ready updated event when hash changed', function (done) {
            this.timeout(5000);
            const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);

            gateway.events.on(EVENTS.GATEWAY_READY, () => {
                if (gateway.config) {
                    gateway.config.hash = 'acg';
                } else {
                    done('config is not defined');
                }
            });

            gateway.events.on(EVENTS.GATEWAY_UPDATED, () => {
                if (gateway.config) {
                    gateway.stopUpdate();
                    done();
                } else {
                    done('config is not defined');
                }
            })
        });
    });
});
