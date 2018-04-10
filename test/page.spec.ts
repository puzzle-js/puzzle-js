import "mocha";
import {Page} from "../src/lib/page";
import {EventEmitter} from "events";
import {expect} from "chai";
import * as fs from "fs";
import * as path from "path";
import {IPageConfiguration} from "../src/types/page";

describe('Page', () => {
    it('should create new page instance', function () {
        const template = fs.readFileSync(path.join(__dirname, './templates/noFragments.html'), 'utf8');
        const newPage = new Page(template, {});

        expect(newPage).to.be.instanceOf(Page);
    });

    it('should parse template with no fragments', function () {
        const template = fs.readFileSync(path.join(__dirname, './templates/noFragmentsWithClass.html'), 'utf8');
        const newPage = new Page(template, {});

        expect(newPage).to.be.instanceOf(Page);
    });

    it('should parse template with fragments', function () {
        const template = fs.readFileSync(path.join(__dirname, './templates/fragmented1.html'), 'utf8');
        const newPage = new Page(template, {});

        expect(newPage).to.be.instanceOf(Page);
    });
});
