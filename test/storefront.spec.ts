import "mocha";
import {expect} from "chai";
import {Storefront} from "../src/storefront";
import {Page} from "../src/page";
import {GatewayStorefrontInstance} from "../src/gatewayStorefront";
import * as fs from "fs";
import * as path from "path";
import request from "supertest";
import {createGateway} from "./mock/mock";

export default () => {
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
            });


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
    });
}
