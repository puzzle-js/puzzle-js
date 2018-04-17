import "mocha";
import {expect} from "chai";
import {Template} from "../src/lib/template";

describe('Page', () => {
    it('should create a new Template instance', function () {
        const template = new Template('<template><div></div></template>');

        expect(template).to.be.instanceOf(Template);
    });

    it('should throw exception if template not found in html', function () {
        const test = () => {
            new Template('<div></div>');
        };

        expect(test).to.throw();
    });

    it('should prepare page class if script exists', function () {
        const template = new Template(`<script>module.exports = { onCreate(){this.testProp = 'test';} }</script><template><div></div></template>`);
        expect(template.pageClass.testProp).to.eq('test');
    });
});
