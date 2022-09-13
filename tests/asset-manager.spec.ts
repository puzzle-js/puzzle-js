import {expect} from "chai";
import {AssetManager} from "../src/asset-manager";
import faker from "faker";

describe('Asset Manager', () => {
    beforeEach(() => {
        AssetManager.init();
    });

    it('should reject when trying to get asset with invalid url', () => {
        const invalidUrl = "{url}";
        const exampleGateway = faker.random.word();

        return AssetManager.getAsset(invalidUrl, exampleGateway).catch((err) => {
            expect(err["url"]).to.be.eq(invalidUrl);
            expect(err["gateway"]).to.be.eq(exampleGateway);
        });
    });
});
