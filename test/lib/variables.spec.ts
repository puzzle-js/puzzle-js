import "mocha";
import {expect} from "chai";
import {JSDOM} from "jsdom";
import {PuzzleJs} from "../../src/lib/puzzle";
import {Variables} from "../../src/lib/modules/variables";
import * as faker from "faker";
import sinon from "sinon";
import {Util} from "../../src/lib/util";

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

describe('Module - Variables', () => {
  beforeEach(() => {
    global.window = (new JSDOM(``, {runScripts: "outside-only"})).window;
  });

  afterEach(() => {
    sinon.restore();
    delete global.window;
    PuzzleJs.clearListeners();
  });

  it('should create new Info', () => {
    const variables = new Variables();

    expect(variables).to.be.instanceof(Variables);
  });

  it('should set fragment variables', function () {
    const variables = new Variables();
    const variable = faker.helpers.userCard();
    const fragmentName = faker.random.word();
    window.__fragment_variable = variable;

    variables.set(fragmentName, '__fragment_variable');

    expect(variables.variables[fragmentName]['__fragment_variable']).to.eq(variable);
  });

  it('should print variables', function () {
    const variables = new Variables();
    const variable = faker.helpers.userCard();
    const fragmentName = faker.random.word();
    const fn = sinon.stub(Util, 'log');
    window.__fragment_variable = variable;

    variables.set(fragmentName, '__fragment_variable');
    variables.print();

    expect(fn.calledWith(variable)).to.true;
  });

  it('should define setter getter for variables', function () {
    const variables = new Variables();
    const variable = {
      fragment: faker.helpers.userCard()
    };

    variables.variables = variable;

    expect(variables.variables).to.eq(variable);
  });
});
