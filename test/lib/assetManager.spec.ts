import "mocha";
import {expect} from "chai";
import {JSDOM} from "jsdom";



export interface Global {
  document: Document;
  window: Window;
}

declare var global: Global;

describe('Asset Helper', () => {
  beforeEach(() => {
    global.window = (new JSDOM(``, {runScripts: "outside-only"})).window;
  });

  afterEach(() => {
    delete global.window;
  });


});
