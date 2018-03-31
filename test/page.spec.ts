import "mocha";
import {IPageConfiguration, Page} from "../lib/page";
import {EventEmitter} from "events";
import {expect} from "chai";
import * as fs from "fs";
import * as path from "path";

describe('Page', () => {
    it('should create new page instance', function () {
        const newPage = new Page('<div></div>', new EventEmitter());

        expect(newPage).to.be.instanceOf(Page);
    });

    it('should parse template with no fragments', function () {
        const template = fs.readFileSync(path.join(__dirname, './templates/noFragmentsWithClass.html'), 'utf8');
        const newPage = new Page(template, new EventEmitter());
        console.log(newPage)
    });
});
