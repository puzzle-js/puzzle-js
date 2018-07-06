import {Module} from "../module";
import {Util} from "../util";
import {PuzzleJs} from "../puzzle";
import {on} from "../decorators";
import {EVENT} from "../enums";

export class Info extends Module {
  @on(EVENT.ON_PAGE_LOAD)
  static showInformation() {
    Util.wrapGroup('PuzzleJs', 'Debug Mode - Package Info', () => {
      this.logo();
      Util.log(`PuzzleJs: ${PuzzleJs.PACKAGE_VERSION}`);
      Util.table(PuzzleJs.DEPENDENCIES);
    });
  }

  static logo() {
    window.console.log('%c       ', `font-size: 400px; background: url(${PuzzleJs.LOGO}) no-repeat;`);
  }
}
