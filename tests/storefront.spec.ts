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
    it('should create a new storefront instance', () => {
        const storefrontConfiguration = new Storefront({
            pages: [],
            port: 4444,
            gateways: [],
            dependencies: []
        });

        expect(storefrontConfiguration).to.be.instanceOf(Storefront);
    });

    it('should create a new storefront instance with configurator', () => {
        const storefrontConfigurator = new StorefrontConfigurator();

        storefrontConfigurator.config({
            pages: [],
            port: 4444,
            gateways: [],
            dependencies: []
        });

        const storefrontConfiguration = new Storefront(storefrontConfigurator);

        expect(storefrontConfiguration).to.be.instanceOf(Storefront);
    });

    it('should create new page instance when registering a new storefront', () => {
        const pageConfiguration = {
            html: fs.readFileSync(path.join(__dirname, './templates/noFragmentsWithClass.html'), 'utf8'),
            url: '/'
        };

        const storefrontInstance = new Storefront({
            pages: [
                pageConfiguration
            ],
            port: 4444,
            gateways: [],
            dependencies: []
        } as any);


        expect(storefrontInstance.pages[pageConfiguration.url]).to.be.instanceOf(Page);
    });

    it('should create new gateway instances when registering a new storefront', () => {
        const gateway = {
            name: 'Browsing',
            url: 'http://browsing-gw.com'
        };
        const storefrontInstance = new Storefront({
            pages: [],
            port: 4444,
            gateways: [
                gateway
            ],
            dependencies: []
        });

        expect(storefrontInstance.gateways[gateway.name]).to.be.instanceOf(GatewayStorefrontInstance);
        storefrontInstance.gateways['Browsing'].stopUpdating();
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
            port: 4444,
            gateways: [
                gateway
            ],
            dependencies: []
        });


        storefrontInstance.init(() => {
            request(storefrontInstance.server.app)
                .get('/healthcheck')
                .expect(200)
                .end(err => {
                    storefrontInstance.server.close();
                    storefrontInstance.gateways['Browsing'].stopUpdating();
                    done(err);
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
            port: 4444,
            gateways: [
                gateway
            ],
            dependencies: []
        });


        storefrontInstance.init(() => {
            request(storefrontInstance.server.app)
                .get(PUZZLE_DEBUGGER_LINK)
                .expect(200)
                .end((err, res) => {
                    storefrontInstance.server.close();
                    storefrontInstance.gateways['Browsing'].stopUpdating();
                    done(err);
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
            port: 4444,
            gateways: [
                gateway
            ],
            dependencies: []
        });


        storefrontInstance.init(() => {
            request(storefrontInstance.server.app)
                .get('/')
                .expect(200)
                .end((err,res) => {
                    storefrontInstance.server.close();
                    storefrontInstance.gateways['Browsing'].stopUpdating();
                    done(err);
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
            port: 4444,
            gateways: [
                gateway
            ],
            dependencies: []
        });


        storefrontInstance.init(() => {
            request(storefrontInstance.server.app)
                .get('/')
                .expect(404)
                .end((err,res) => {
                    storefrontInstance.server.close();
                    storefrontInstance.gateways['Browsing'].stopUpdating();
                    done(err);
                });
        });
    });
});

