import {expect} from "chai";
import {JSDOM} from "jsdom";
import {Util} from "../../src/lib/util";
import {PuzzleJs} from "../../src/lib/puzzle";
import sinon from "sinon";
import * as faker from "faker";

declare global {
    interface Window {
        PuzzleJs: PuzzleJs;
    }
}

export interface Global {
    document: Document;
    window: Window;
}

declare var global: Global;

describe('Module - Util', () => {
    beforeEach(() => {
        global.window = (new JSDOM(``, {runScripts: "outside-only"})).window;
    });

    afterEach(() => {
        delete global.window;
        PuzzleJs.clearListeners();
    });

    it('should create new Util', () => {
        const util = new Util();

        expect(util).to.be.instanceof(Util);
    });

    it('should wrap group in console', () => {
        const groupStub = sinon.stub(global.window.console, 'groupCollapsed');
        const logStub = sinon.stub(global.window.console, 'log');
        const groupEndStub = sinon.stub(global.window.console, 'groupEnd');
        const fakerWords = [faker.random.word(), faker.random.word(), faker.random.word()];

        Util.wrapGroup(fakerWords[0], fakerWords[1], () => {
            window.console.log(fakerWords[2]);
        });

        expect(groupStub.calledOnce).to.true;
        expect(logStub.calledOnce).to.true;
        expect(groupEndStub.calledOnce).to.true;
    });

    it('should log with Puzzle theme', () => {
        const logStub = sinon.stub(global.window.console, 'info');
        const log = faker.random.word();

        Util.log(log);

        expect(logStub.calledOnce).to.true;
    });

    it('should crete table', function () {
        const logStub = sinon.stub(global.window.console, 'table');
        const object = faker.helpers.userCard();

        Util.table(object);

        expect(logStub.calledOnce).to.true;
        expect(logStub.calledWith(object)).to.true;
    });
});
