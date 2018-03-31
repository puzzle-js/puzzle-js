import "mocha";
import {expect} from "chai";
import {Storefront} from "../lib/storefront";
import {Page} from "../lib/page";
import {GatewayStorefrontInstance} from "../lib/gateway";

describe('Storefront', function () {
    it('should create a new storefront instance', function () {
        const storefrontConfiguration = new Storefront({
            pages: [],
            port: 4444,
            gateways: []
        });

        expect(storefrontConfiguration).to.be.instanceOf(Storefront);
    });

    it('should create new page instance when registering a new storefront', function () {
        const pageConfiguration = {
            html: '<div></div>',
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

    it('should create new gateway instances when registering a new storefront', function () {
        const gateway = {
            name: 'Browsing',
            url: 'http://localhost:4446'
        };
        const storefrontInstance = new Storefront({
            pages: [],
            port: 4444,
            gateways: [
                gateway
            ]
        });

        expect(storefrontInstance.gateways[gateway.name]).to.be.instanceOf(GatewayStorefrontInstance);
    });
});
