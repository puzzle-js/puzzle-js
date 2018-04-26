import "mocha";
import {expect} from "chai";
import ResourceFactory from "../src/lib/resourceFactory";

describe('Resource Factory', () => {
    it('should create a new resource factory instance', function () {
        expect(ResourceFactory.instance).to.be.instanceOf(ResourceFactory);
    });

    it('should return same instance', function () {
        const rFac = ResourceFactory.instance as any;
        rFac.test = true;

        expect(ResourceFactory.instance).to.haveOwnProperty('test');
    });

    it('should register new dependency', function () {

    });
});
