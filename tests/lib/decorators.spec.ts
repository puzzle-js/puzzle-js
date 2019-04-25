import {JSDOM} from "jsdom";
import {PuzzleJs} from "../../src/lib/puzzle";
import {on} from "../../src/lib/decorators";
import {EVENT} from "../../src/lib/enums";


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

describe('PuzzleLib Decorators', () => {
    beforeEach(() => {
        global.window = (new JSDOM(``, {runScripts: "outside-only"})).window;
    });

    afterEach(() => {
        delete global.window;
        PuzzleJs.clearListeners();
    });

    it('should register for events on PuzzleJs', (done) => {
        class Test {
            @on(EVENT.ON_PAGE_LOAD)
            static pageLoaded() {
                done();
            }
        }

        PuzzleJs.emit(EVENT.ON_PAGE_LOAD);
    });
});
