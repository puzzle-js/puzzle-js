import {Module} from "../module";
import {Util} from "../util";
import {PuzzleJs} from "../puzzle";
import {EVENT, LOG_COLORS} from "../enums";
import {on} from "../decorators";

export interface IPageVariables {
  [fragmentName: string]: { [name: string]: any };
}

export class Variables extends Module {
  static get variables(): IPageVariables {
    return Variables.__variables;
  }

  static set variables(value: IPageVariables) {
    Variables.__variables = value;
  }

  private static __variables: IPageVariables = {};

  @on(EVENT.ON_PAGE_LOAD)
  static print() {
    Util.wrapGroup('PuzzleJs', 'Debug Mode - Variables', () => {
      Object.keys(Variables.variables).forEach(fragmentName => {
        Util.wrapGroup('PuzzleJs', fragmentName, () => {
          Object.keys(Variables.variables[fragmentName]).forEach(configKey => {
            Util.wrapGroup('PuzzleJs', configKey, () => {

              Util.log(Variables.variables[fragmentName][configKey]);
            }, LOG_COLORS.YELLOW);
          });
        }, LOG_COLORS.BLUE);
      });
    });
  }


  @on(EVENT.ON_VARIABLES)
  static set(fragmentName: string, varName: string, configData: object) {
    if (!Variables.variables[fragmentName]) {
      Variables.variables[fragmentName] = {};
    }
    Variables.variables[fragmentName][varName] = configData;
  }
}
