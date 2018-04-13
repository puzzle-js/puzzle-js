import "mocha";
import {Page} from "../src/lib/page";
import {EventEmitter} from "events";
import {expect} from "chai";
import * as fs from "fs";
import * as path from "path";
import {IPageConfiguration} from "../src/types/page";
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
                        dependencies: []
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
});
