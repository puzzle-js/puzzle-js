import "mocha";
import {expect} from "chai";
import {JSDOM} from "jsdom";
import {PuzzleJs} from "../../src/lib/puzzle";
import {Variables} from "../../src/lib/modules/variables";
import * as faker from "faker";
import sinon from "sinon";
import {Util} from "../../src/lib/util";
import {Fragments} from "../../src/lib/modules/fragments";

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
    const fragments = new Fragments();

    expect(fragments).to.be.instanceof(Fragments);
  });

  it('should log fragment information', function () {
    const fragments = new Fragments();
    const fn = sinon.stub(Util, 'log');
    const variable = {
      fragmentName: faker.helpers.userCard()
    };

    fragments.set(variable);

    expect(fn.calledWith(variable['fragmentName'])).to.true;
  });
});
