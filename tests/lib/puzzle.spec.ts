import {expect} from "chai";
import {JSDOM} from "jsdom";
import {PuzzleJs} from "../../src/lib/puzzle";
import {EVENT} from "../../src/lib/enums";
import sinon from "sinon";
import * as faker from "faker";

export interface Global {
    document: Document;
    window: Window;
}

declare var global: Global;

describe('PuzzleJs', () => {
    beforeEach(() => {
        global.window = (new JSDOM(``, {runScripts: "outside-only"})).window;
    });

    afterEach(() => {
        delete global.window;
        PuzzleJs.clearListeners();
    });

    it('should has a method for injecting modules', function () {
        class Module {
            constructor() {
            }

            static m() {
            }
        }

        PuzzleJs.inject({module: Module});

        expect((<any>PuzzleJs)['module'].m).to.eq(Module.m);
    });

    it('should register listeners', function () {
        const fn = sinon.spy();
        const variable = faker.helpers.createCard();

        PuzzleJs.subscribe(EVENT.ON_PAGE_LOAD, fn);
        PuzzleJs.emit(EVENT.ON_PAGE_LOAD, variable);

        expect(fn.calledWithExactly(variable)).to.true;
    });
});
