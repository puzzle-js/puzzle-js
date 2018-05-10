import "mocha";
import {expect} from "chai";
import {Storefront} from "../src/storefront";
import {Page} from "../src/page";
import {GatewayStorefrontInstance} from "../src/gateway";
import * as fs from "fs";
import * as path from "path";

export default () => {
    describe('Storefront', () => {
        it('should create a new storefront instance', () => {
            const storefrontConfiguration = new Storefront({
                pages: [],
                port: 4444,
                gateways: []
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
                gateways: []
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
                ]
            });

            expect(storefrontInstance.gateways[gateway.name]).to.be.instanceOf(GatewayStorefrontInstance);
            storefrontInstance.gateways['Browsing'].stopUpdating();
        });
    });
}
