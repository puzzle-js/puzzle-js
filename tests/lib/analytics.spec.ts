import {expect} from "chai";
import {JSDOM} from "jsdom";
import {PuzzleJs} from "../../src/lib/puzzle";
import sinon from "sinon";
import {Analytics} from "../../src/lib/modules/analytics";

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

describe('Module - Fragments', () => {
    beforeEach(() => {
        global.window = (new JSDOM(``, {runScripts: "outside-only"})).window;
    });

    afterEach(() => {
        sinon.restore();
        delete global.window;
        PuzzleJs.clearListeners();
    });

    it('should create new Fragments', () => {
        const fragments = new Analytics();

        expect(fragments).to.be.instanceof(Analytics);
    });
});
