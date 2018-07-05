import "mocha";
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

  it('It should export class PuzzleJs', () => {
    const puzzle = new PuzzleJs();

    expect(puzzle).to.be.instanceOf(PuzzleJs);
  });

  it('should has a method for injecting modules', function () {
    const puzzle = new PuzzleJs();
    class Module {
      constructor(){}
      m(){}
    }

    puzzle.inject({module: Module});

    expect(puzzle.module).to.be.instanceOf(Module);
  });

  it('should register listeners', function () {
    const fn = sinon.spy();
    const variable = faker.helpers.createCard();

    PuzzleJs.subscribe(EVENT.ON_PAGE_LOAD, fn);
    PuzzleJs.emit(EVENT.ON_PAGE_LOAD, variable);

    expect(fn.calledWithExactly(variable)).to.true;
  });
});
