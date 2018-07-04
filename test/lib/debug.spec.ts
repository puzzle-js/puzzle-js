import "mocha";
import {expect} from "chai";
import {PuzzleJs} from "../../src/lib/puzzle";
import {JSDOM} from "jsdom";

declare global {
  interface Window { PuzzleJs: PuzzleJs; }
}

export interface Global {
  document: Document;
  window: Window;
}

declare var global: Global;

describe('PuzzleJs Debug Lib', () => {
  beforeEach(() => {
    global.window = (new JSDOM(``, {runScripts: "outside-only"})).window;
  });

  afterEach(() => {
    delete global.window;
  });

  it('should declare PuzzleJs under window', () => {
    require("../../src/lib/debug");

    expect(window.PuzzleJs).to.be.instanceOf(PuzzleJs);
  });
});
