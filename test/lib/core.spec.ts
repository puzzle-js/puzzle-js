import "mocha";
import {expect} from "chai";
import {JSDOM} from "jsdom";
import {PuzzleJs} from "../../src/lib/puzzle";
import {Core} from "../../src/lib/core";
import {createPageLibConfiguration} from "./mock";
import * as faker from "faker";

declare global {
  interface Window { PuzzleJs: PuzzleJs; }
}

export interface Global {
  document: Document;
  window: Window;
}

declare var global: Global;

describe('Module - Core', () => {
  beforeEach(() => {
    global.window = (new JSDOM(``, {runScripts: "outside-only"})).window;
  });

  afterEach(() => {
    delete global.window;
    PuzzleJs.clearListeners();
    Core._pageConfiguration = {};
  });

  it('should create new Info', () => {
    const core = new Core();

    expect(core).to.be.instanceof(Core);
  });

  it('should register Page configuration', () => {
    const pageConfiguration = createPageLibConfiguration();

    Core.config(pageConfiguration);

    expect(Core._pageConfiguration).to.eq(pageConfiguration);
  });

  it('should load fragment and replace its contenst', function () {
    const fragmentName = faker.random.word();
    const fragmentContent = faker.random.words();
    const fragmentContainerId = "fragment-container";
    const fragmentContentId = "fragment-content";
    const fragmentContainer = global.window.document.createElement('div');
    fragmentContainer.setAttribute('id', fragmentContainerId);
    global.window.document.body.appendChild(fragmentContainer);
    const fragmentContentContainer = global.window.document.createElement('div');
    fragmentContentContainer.setAttribute('id', fragmentContentId);
    fragmentContentContainer.innerHTML = fragmentContent;
    global.window.document.body.appendChild(fragmentContentContainer);

    Core.load(fragmentName, `#${fragmentContainerId}`, `#${fragmentContentId}`);

    expect(global.window.document.body.innerHTML).to.eq(`<div id="${fragmentContainerId}">${fragmentContent}</div>`);
  });
});
