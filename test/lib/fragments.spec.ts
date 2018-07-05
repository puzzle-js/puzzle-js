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
    __fragment_variable: any;
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
    delete global.window;
  });

  it('should create new Info', () => {
    const fragments = new Fragments();

    expect(fragments).to.be.instanceof(Fragments);
  });
});
