import "mocha";
import {expect} from "chai";
import {JSDOM} from "jsdom";
import {PuzzleJs} from "../../src/lib/puzzle";
import {Info} from "../../src/lib/modules/info";

declare global {
  interface Window { PuzzleJs: PuzzleJs; }
}

export interface Global {
  document: Document;
  window: Window;
}

declare var global: Global;

describe('Module - Info', () => {
  beforeEach(() => {
    global.window = (new JSDOM(``, {runScripts: "outside-only"})).window;
  });

  afterEach(() => {
    delete global.window;
  });

  it('should create new Info', () => {
    const info = new Info();

    expect(info).to.be.instanceof(Info);
  });
});
