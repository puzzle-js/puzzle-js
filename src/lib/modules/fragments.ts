import {Module} from "../module";
import {Util} from "../util";
import {PuzzleJs} from "../puzzle";
import {EVENT, LOG_COLORS} from "../enums";

export class Fragments extends Module {
  variables: { [name: string]: object };

  set(fragmentInfo: object) {
    Util.wrapGroup('PuzzleJs', 'Debug Mode - Fragments', () => {
      Object.keys(fragmentInfo).forEach(fragmentName => {
        Util.wrapGroup('PuzzleJs', fragmentName, () => {
          Util.log(fragmentInfo[fragmentName]);
        }, LOG_COLORS.BLUE);
      });
    });
  }
}
