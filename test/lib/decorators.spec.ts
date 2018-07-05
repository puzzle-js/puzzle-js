import "mocha";
import {expect} from "chai";
import {JSDOM} from "jsdom";
import {PuzzleJs} from "../../src/lib/puzzle";
import sinon from "sinon";
import {on} from "../../src/lib/decorators";
import {EVENT} from "../../src/lib/enums";


declare global {
  interface Window { PuzzleJs: PuzzleJs; }
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

  it('should register for events on PuzzleJs', function () {
    class Test {
      blabla: number;

      constructor(){
        this.blabla = 5;
      }

      @on(EVENT.ON_PAGE_LOAD)
      pageLoaded(){
        console.log(this.blabla);
      }
    }
    const test = new Test();
    const fn = sinon.stub(test, 'pageLoaded');

    PuzzleJs.emit(EVENT.ON_PAGE_LOAD);

    expect(fn.called).to.true;
  });
});
