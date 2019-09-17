import {expect} from "chai";
import {Storefront} from "../src/storefront";
import {Page} from "../src/page";
import {GatewayStorefrontInstance} from "../src/gatewayStorefront";
import * as fs from "fs";
import * as path from "path";
import request from "supertest";
import {createGateway} from "./mock/mock";
import {StorefrontConfigurator} from "../src/configurator";
import {PUZZLE_DEBUGGER_LINK} from "../src/config";
import sinon from "sinon";

describe('Storefront', () => {

    it('should create a new storefront instance', (done) => {
        const storefront = new Storefront({
            pages: [],
            serverOptions: {
                port: 4444
            },
            gateways: [],
            dependencies: []
        });

        expect(storefront).to.be.instanceOf(Storefront);
        storefront.server.close(done);
    });

    it('should create a new storefront instance with configurator', (done) => {
        const storefrontConfigurator = new StorefrontConfigurator();

        storefrontConfigurator.config({
            pages: [],
            serverOptions: {
                port: 4444
            },
            gateways: [],
            dependencies: []
        });

        const storefront = new Storefront(storefrontConfigurator);

        expect(storefront).to.be.instanceOf(Storefront);
        storefront.server.close(done);
    });

    it('should create new page instance when registering a new storefront', (done) => {
        const pageConfiguration = {
            name: 'page',
            html: fs.readFileSync(path.join(__dirname, './templates/noFragmentsWithClass.html'), 'utf8'),
            url: '/'
        };

        const storefrontInstance = new Storefront({
            pages: [
                pageConfiguration
            ],
            serverOptions: {
                port: 4444
            },
            gateways: [],
            dependencies: []
        } as any);


        expect(storefrontInstance.pages.get(pageConfiguration.name)).to.be.instanceOf(Page);
        storefrontInstance.server.close(done);
    });

    it('should create new gateway instances when registering a new storefront', (done) => {
        const gateway = {
            name: 'Browsing',
            url: 'http://browsing-gw.com'
        };
        const storefrontInstance = new Storefront({
            pages: [],
            serverOptions: {
                port: 4444
            },
            gateways: [
                gateway
            ],
            dependencies: []
        });

        expect(storefrontInstance.gateways[gateway.name]).to.be.instanceOf(GatewayStorefrontInstance);
        storefrontInstance.gateways['Browsing'].stopUpdating();
        storefrontInstance.server.close(done);
    });

    it('should add health check route', done => {
        const gateway = {
            name: 'Browsing',
            url: 'http://browsing-gw.com'
        };

        const scope = createGateway(gateway.name, gateway.url, {
            hash: '1234',
            fragments: {}
        });


        const storefrontInstance = new Storefront({
            pages: [],
            serverOptions: {
                port: 4444
            },
            gateways: [
                gateway
            ],
            dependencies: []
        });


        storefrontInstance.init(() => {
            request(storefrontInstance.server.handler.getApp())
                .get('/healthcheck')
                .expect(200)
                .end(err => {
                    storefrontInstance.gateways['Browsing'].stopUpdating();
                    storefrontInstance.server.close(done);
                });
        });
    });

    it('should add debug script route', done => {
        const gateway = {
            name: 'Browsing',
            url: 'http://browsing-gw.com'
        };

        const scope = createGateway(gateway.name, gateway.url, {
            hash: '1234',
            fragments: {}
        });

        const storefrontInstance = new Storefront({
            pages: [],
            serverOptions: {
                port: 4444
            },
            gateways: [
                gateway
            ],
            dependencies: []
        });


        storefrontInstance.init(() => {
            request(storefrontInstance.server.handler.getApp())
                .get(PUZZLE_DEBUGGER_LINK)
                .expect(200)
                .end((err, res) => {
                    storefrontInstance.gateways['Browsing'].stopUpdating();
                    storefrontInstance.server.close(done);
                });
        });
    });

    it('should add route with condition', done => {
        const spy = sinon.stub().returns(true);
        const gateway = {
            name: 'Browsing',
            url: 'http://browsing-gw.com'
        };

        const scope = createGateway(gateway.name, gateway.url, {
            hash: '1234',
            fragments: {}
        });

        const storefrontInstance = new Storefront({
            pages: [
                {
                    url: '/',
                    html: '<template><html><head></head><body></body></html></template>',
                    name: 'test',
                    condition: spy
                }
            ],
            serverOptions: {
                port: 4444
            },
            gateways: [
                gateway
            ],
            dependencies: []
        });


        storefrontInstance.init(() => {
            request(storefrontInstance.server.handler.getApp())
                .get('/')
                .expect(200)
                .end((err,res) => {
                    storefrontInstance.server.close(done);
                    storefrontInstance.gateways['Browsing'].stopUpdating();
                });
        });
    });

    it('should pass page if condition is not validf', done => {
        const spy = sinon.stub().returns(false);
        const gateway = {
            name: 'Browsing',
            url: 'http://browsing-gw.com'
        };

        const scope = createGateway(gateway.name, gateway.url, {
            hash: '1234',
            fragments: {}
        });

        const storefrontInstance = new Storefront({
            pages: [
                {
                    url: '/',
                    html: '<template><html><head></head><body></body></html></template>',
                    name: 'test',
                    condition: spy
                }
            ],
            serverOptions: {
                port: 4444
            },
            gateways: [
                gateway
            ],
            dependencies: []
        });


        storefrontInstance.init(() => {
            request(storefrontInstance.server.handler.getApp())
                .get('/')
                .expect(404)
                .end((err,res) => {
                    storefrontInstance.gateways['Browsing'].stopUpdating();
                    storefrontInstance.server.close(done);
                });
        });
    });
});

