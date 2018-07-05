import {Module} from "../module";
import {Util} from "../util";
import {PuzzleJs} from "../puzzle";
import {EVENT, LOG_COLORS} from "../enums";

export interface IPageVariables {
  [fragmentName: string]: { [name: string]: any };
}

export class Variables extends Module {
  get variables(): IPageVariables {
    return this._variables;
  }

  set variables(value: IPageVariables) {
    this._variables = value;
  }

  private _variables: IPageVariables = {};

  constructor() {
    super();
    PuzzleJs.subscribe(EVENT.PAGE_LOADED, this.print.bind(this));
  }

  set(fragmentName: string, varName: string) {
    if (!this.variables[fragmentName]) {
      this.variables[fragmentName] = {};
    }
    this.variables[fragmentName][varName] = window[varName];
  }

  print() {
    Util.wrapGroup('PuzzleJs', 'Debug Mode - Variables', () => {
      Object.keys(this.variables).forEach(fragmentName => {
        Util.wrapGroup('PuzzleJs', fragmentName, () => {
          Object.keys(this.variables[fragmentName]).forEach(configKey => {
            Util.wrapGroup('PuzzleJs', configKey, () => {
              Util.log(this.variables[fragmentName][configKey]);
            }, LOG_COLORS.YELLOW);
          });
        }, LOG_COLORS.BLUE);
      });
    });
  }
}
