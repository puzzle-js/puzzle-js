import {Module} from "../module";
import {Util} from "../util";
import {PuzzleJs} from "../puzzle";
import {EVENT, LOG_COLORS} from "../enums";

export interface IFragmentInfo {
  [fragmentName: string]: {
    [name: string]: any
  }
}

export class Fragments extends Module {
  set(fragmentInfo: IFragmentInfo) {
    Util.wrapGroup('PuzzleJs', 'Debug Mode - Fragments', () => {
      Object.keys(fragmentInfo).forEach(fragmentName => {
        Util.wrapGroup('PuzzleJs', fragmentName, () => {
          Util.log(fragmentInfo[fragmentName]);
        }, LOG_COLORS.BLUE);
      });
    });
  }
}
