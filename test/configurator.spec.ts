import {expect} from "chai";
import {Configurator, GatewayConfigurator, StorefrontConfigurator} from "../src/configurator";
import {IGatewayBFFConfiguration, IStorefrontConfig} from "../src/types";
import {HTTP_METHODS, INJECTABLE} from "../src/enums";

export default () => {
    describe('Configurator', () => {
        it('should create new configurator instance', () => {
            const configurator = new Configurator();

            expect(configurator).to.be.instanceOf(Configurator);
        });

        it('should create new storefront configurator instance', () => {
            const configurator = new StorefrontConfigurator();

            expect(configurator).to.be.instanceOf(Configurator);
        });

        it('should create new gateway configurator instance', () => {
            const configurator = new GatewayConfigurator();

            expect(configurator).to.be.instanceOf(Configurator);
        });

        it('should register given dependencies', () => {
            const configurator = new Configurator();

            const dependency = {
                a: 5
            };

            configurator.register('middleware', INJECTABLE.MIDDLEWARE, dependency);

            expect(configurator.get('middleware', INJECTABLE.MIDDLEWARE)).to.deep.eq(dependency);
        });

        it('should set given configuration', () => {
            const configurator = new StorefrontConfigurator();

            const config = {
                dependencies: [],
                gateways: [],
                pages: [],
                port: 32
            } as IStorefrontConfig;

            configurator.config(config);

            expect(configurator.configuration).to.deep.eq(config);
        });

        it('should throw error when trying to validate from base class', () => {
            const configurator = new Configurator();

            const config = {
                dependencies: [],
                gateways: [],
                pages: [],
                port: 32
            } as IStorefrontConfig;

            const test = () => {
                configurator.config(config);
            };

            expect(test).to.throw();
        });

        it('should throw error when wrong storefront configuration provided', () => {
            const configurator = new StorefrontConfigurator();

            const config = {
                dependencies: [],
                gateways: [],
            } as any;

            const test = () => {
                configurator.config(config);
            };

            expect(test).to.throw();
        });

        it('should throw error when wrong gateway configuration provided', () => {
            const configurator = new GatewayConfigurator();

            const config = {
                dependencies: [],
                gateways: [],
            } as any;

            const test = () => {
                configurator.config(config);
            };

            expect(test).to.throw();
        });

        it('should inject dependencies to configuration for api handlers', () => {
            const configurator = new GatewayConfigurator();

            const config = {
                api: [
                    {
                        name: 'api',
                        liveVersion: '1.0.0',
                        testCookie: 'test',
                        versions: {
                            '1.0.0': {
                                handler: 'injectable',
                                endpoints: []
                            }
                        }
                    }
                ],
                fragmentsFolder: '',
                name: 'Browsing',
                url: 'http://',
                port: 32,
                fragments: []
            } as IGatewayBFFConfiguration;

            const handler = {
                data() {

                },
                content() {

                },
                placeholder() {

                }
            };

            configurator.register('injectable', INJECTABLE.HANDLER, handler);

            configurator.config(config);

            expect(configurator.configuration.api[0].versions['1.0.0'].handler).to.deep.eq(handler);
        });

        it('should inject dependencies to configuration for fragment handlers', () => {
            const configurator = new GatewayConfigurator();

            const config = {
                api: [],
                fragmentsFolder: '',
                name: 'Browsing',
                url: 'http://',
                port: 32,
                fragments: [
                    {
                        versions: {
                            '1.0.0': {
                                assets: [],
                                dependencies: [],
                                handler: 'injectable'
                            }
                        },
                        version: '1.0.0',
                        testCookie: '',
                        render: {
                            url: ''
                        },
                        name: 'test'
                    }
                ]
            } as any;

            const handler = {
                data() {

                },
                content() {

                },
                placeholder() {

                }
            };

            configurator.register('injectable', INJECTABLE.HANDLER, handler);

            configurator.config(config);

            expect(configurator.configuration.fragments[0].versions['1.0.0'].handler).to.deep.eq(handler);
        });

        it('should inject dependencies to configuration for fragment render middleware', () => {
            const configurator = new GatewayConfigurator();

            const config = {
                api: [],
                fragmentsFolder: '',
                name: 'Browsing',
                url: 'http://',
                port: 32,
                fragments: [
                    {
                        versions: {
                            '1.0.0': {
                                assets: [],
                                dependencies: [],
                            }
                        },
                        version: '1.0.0',
                        testCookie: '',
                        render: {
                            url: '',
                            middlewares: ['injectable']
                        },
                        name: 'test'
                    }
                ]
            } as IGatewayBFFConfiguration;

            const handler = {
                data() {

                },
                content() {

                },
                placeholder() {

                }
            };

            configurator.register('injectable', INJECTABLE.MIDDLEWARE, handler);

            configurator.config(config);

            expect(configurator.configuration.fragments[0].render.middlewares).to.deep.include(handler);
        });

        it('should inject dependencies to configuration for fragment render middleware', () => {
            const configurator = new GatewayConfigurator();

            const config = {
                api: [
                    {
                        name: 'api',
                        liveVersion: '1.0.0',
                        testCookie: 'test',
                        versions: {
                            '1.0.0': {
                                handler: 'injectable',
                                endpoints: [
                                    {
                                        path: '/',
                                        middlewares: ['injectable2'],
                                        method: HTTP_METHODS.POST,
                                        controller: ''
                                    }
                                ]
                            }
                        }
                    }
                ],
                fragmentsFolder: '',
                name: 'Browsing',
                url: 'http://',
                port: 32,
                fragments: []
            } as any;

            const handler = {
                a: 5
            };

            const handler2 = {
                a: 3
            };

            configurator.register('injectable2', INJECTABLE.MIDDLEWARE, handler2);
            configurator.register('injectable', INJECTABLE.HANDLER, handler);

            configurator.config(config);

            expect(configurator.configuration.api[0].versions['1.0.0'].endpoints[0].middlewares).to.deep.include(handler2);
        });
    });
}
