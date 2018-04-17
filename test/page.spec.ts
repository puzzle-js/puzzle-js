import "mocha";
import {Page} from "../src/lib/page";
import {expect} from "chai";
import * as fs from "fs";
import * as path from "path";
import {GatewayStorefrontInstance} from "../src/lib/gateway";
import {createGateway} from "./mock/mock";
import {EVENTS} from "../src/lib/enums";

describe('Page', () => {
    it('should create new page instance', function () {
        const template = fs.readFileSync(path.join(__dirname, './templates/noFragments.html'), 'utf8');
        const newPage = new Page(template, {});

        expect(newPage).to.be.instanceOf(Page);
    });

    it('should parse template with no fragments', function () {
        const template = fs.readFileSync(path.join(__dirname, './templates/noFragmentsWithClass.html'), 'utf8');
        const newPage = new Page(template, {});

        expect(newPage).to.be.instanceOf(Page);
    });

    it('should parse template with fragments', function () {
        const template = fs.readFileSync(path.join(__dirname, './templates/fragmented1.html'), 'utf8');
        const newPage = new Page(template, {});

        expect(newPage).to.be.instanceOf(Page);
    });

    it('should create gateway dependencies', function () {
        const template = fs.readFileSync(path.join(__dirname, './templates/fragmented1.html'), 'utf8');
        const newPage = new Page(template, {});

        expect(newPage.gatewayDependencies).to.deep.eq({
            fragments: {
                header: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'header'
                    }
                },
                content: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'content'
                    }
                },
                footer: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'footer'
                    }
                }
            },
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            }
        });
    });

    it('should track for gateways to get ready', function (done) {
        const commonGatewayStorefrontConfiguration = {
            name: 'Browsing',
            url: 'http://browsing-gw.com',
            config: {
                hash: '44',
                fragments: {
                    header: {
                        version: '1.0.0',
                        render: {
                            url: '/'
                        },
                        assets: [],
                        dependencies: [],
                        testCookie: 'test_1'
                    }
                }
            }
        };
        createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
        const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);
        const template = fs.readFileSync(path.join(__dirname, './templates/fragmented2.html'), 'utf8');
        const newPage = new Page(template, {
            Browsing: gateway
        });

        gateway.events.on(EVENTS.GATEWAY_READY, () => {
           expect(newPage.gatewayDependencies.gateways['Browsing'].ready).to.eq(true);
           done();
        });
    });

    it('should set page status to ready gateways are already ready', function () {
        const commonGatewayStorefrontConfiguration = {
            name: 'Browsing',
            url: 'http://browsing-gw.com',
            config: {
                hash: '44',
                fragments: {
                    header: {
                        version: '1.0.0',
                        render: {
                            url: '/'
                        },
                        assets: [],
                        dependencies: [],
                        testCookie: 'test_1'
                    }
                }
            }
        };
        createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
        const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);

        const template = fs.readFileSync(path.join(__dirname, './templates/fragmented2.html'), 'utf8');
        gateway.config = {
            hash: '44',
            fragments: {
                header: {
                    version: '1.0.0',
                    render: {
                        url: '/'
                    },
                    assets: [],
                    dependencies: [],
                    testCookie: 'test_1'
                }
            }
        };
        const newPage = new Page(template, {
            Browsing: gateway
        });

        expect(newPage.gatewayDependencies.gateways.Browsing.ready).to.eq(true);
        expect(newPage.ready).to.eq(true);
    });

    it('should wait for all gateways to be ready to change status to ready', function (done) {
        const commonGatewayStorefrontConfiguration = {
            name: 'Browsing',
            url: 'http://browsing-gw.com',
            config: {
                hash: '44',
                fragments: {
                    header: {
                        version: '1.0.0',
                        render: {
                            url: '/'
                        },
                        assets: [],
                        dependencies: [],
                        testCookie: 'test_1'
                    }
                }
            }
        };
        const commonGatewayStorefrontConfiguration2 = {
            name: 'Search',
            url: 'http://browsing-gw.com',
            config: {
                hash: '44',
                fragments: {
                    search: {
                        version: '1.0.0',
                        render: {
                            url: '/'
                        },
                        assets: [],
                        dependencies: [],
                        testCookie: 'test_1'
                    }
                }
            }
        };
        createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
        createGateway(commonGatewayStorefrontConfiguration2.name, commonGatewayStorefrontConfiguration2.url, commonGatewayStorefrontConfiguration2.config, true);
        const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);
        const gateway2 = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration2);
        const template = fs.readFileSync(path.join(__dirname, './templates/fragmented3.html'), 'utf8');
        const newPage = new Page(template, {
            Browsing: gateway,
            Search: gateway2
        });
        let i = 0;

        gateway.events.on(EVENTS.GATEWAY_READY, () => {
            expect(newPage.gatewayDependencies.gateways['Browsing'].ready).to.eq(true);
            i++;
            if(i == 2){
                expect(newPage.ready).to.eq(true);
                done();
            }
        });

        gateway2.events.on(EVENTS.GATEWAY_READY, () => {
            expect(newPage.gatewayDependencies.gateways['Search'].ready).to.eq(true);
            i++;
            if(i == 2){
                expect(newPage.ready).to.eq(true);
                done();
            }
        });
    });

    it('should update fragment information when gateways updated', function (done) {
        const commonGatewayStorefrontConfiguration = {
            name: 'Browsing',
            url: 'http://browsing-gw.com',
            config: {
                hash: '44',
                fragments: {
                    header: {
                        version: '1.0.0',
                        render: {
                            url: '/'
                        },
                        assets: [],
                        dependencies: [],
                        testCookie: 'test_1'
                    }
                }
            }
        };
        createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
        const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);
        const template = fs.readFileSync(path.join(__dirname, './templates/fragmented2.html'), 'utf8');
        const newPage = new Page(template, {
            Browsing: gateway
        });

        gateway.events.on(EVENTS.GATEWAY_READY, () => {
            expect(newPage.gatewayDependencies.gateways['Browsing'].ready).to.eq(true);

            if(gateway.config){
                gateway.config.fragments.header.testCookie = 'zek';
                gateway.events.emit(EVENTS.GATEWAY_UPDATED, gateway);
            }
        });

        gateway.events.on(EVENTS.GATEWAY_UPDATED, () => {
           if(gateway.config){
               expect(gateway.config.fragments.header.testCookie).to.eq('zek');
               if(newPage.gatewayDependencies.fragments.header.instance.config){
                   expect(newPage.gatewayDependencies.fragments.header.instance.config.testCookie).to.eq('zek');
                   done();
               }else{
                   done('config does not exists on istance')
               }
           }else{
               done('Gateway config is not defined');
           }
        });
    });

    it('should compile page with fragments cookies', function (done) {
        const commonGatewayStorefrontConfiguration = {
            name: 'Browsing',
            url: 'http://browsing-gw.com',
            config: {
                hash: '44',
                fragments: {
                    header: {
                        version: '1.0.0',
                        render: {
                            url: '/'
                        },
                        assets: [],
                        dependencies: [],
                        testCookie: 'test_1'
                    }
                }
            }
        };
        createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
        const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);
        const template = fs.readFileSync(path.join(__dirname, './templates/fragmented2.html'), 'utf8');
        const newPage = new Page(template, {
            Browsing: gateway
        });

        gateway.events.on(EVENTS.GATEWAY_READY, async () => {
            await newPage.handle({
                cookies: {
                    a: 'acg was here',
                    test_1: 'special'
                }
            }, {});
            expect(newPage.responseHandlers).to.haveOwnProperty('{test_1_special}');
            done();
        });
    });

    it('should compile page without fragments cookies (default version)', function (done) {
        const commonGatewayStorefrontConfiguration = {
            name: 'Browsing',
            url: 'http://browsing-gw.com',
            config: {
                hash: '44',
                fragments: {
                    header: {
                        version: '1.0.0',
                        render: {
                            url: '/'
                        },
                        assets: [],
                        dependencies: [],
                        testCookie: 'test_1'
                    }
                }
            }
        };
        createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
        const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);
        const template = fs.readFileSync(path.join(__dirname, './templates/fragmented2.html'), 'utf8');
        const newPage = new Page(template, {
            Browsing: gateway
        });

        gateway.events.on(EVENTS.GATEWAY_READY, async () => {
            await newPage.handle({
                cookies: {
                    a: 'acg was here',
                }
            }, {});
            expect(newPage.responseHandlers).to.haveOwnProperty('{test_1_1.0.0}');
            done();
        });
    });
});
