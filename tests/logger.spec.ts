import "../src/base";
import {expect} from "chai";
import "../src/logger";

describe('Logger', function () {
    it('should add prototype to Error for stringify', function () {
        const e = new Error('Sample Error');
        const stringified = JSON.stringify(e);

        expect(stringified).to.include('Sample Error');
    });
});
