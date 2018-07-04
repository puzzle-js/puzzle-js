import {Module} from "../module";
import {Util} from "../util";
import {PuzzleJs} from "../puzzle";

export class Info extends Module {
  constructor() {
    super();

    this.showInformation();
  }

  private showInformation() {
    Util.wrapGroup('PuzzleJs', 'Debug Mode - Package Info', () => {
      this.logo();
      Util.log(`PuzzleJs: ${PuzzleJs.PACKAGE_VERSION}`);
      Util.table(PuzzleJs.DEPENDENCIES);
    });
  }

  private logo() {
    console.log('%c       ', `font-size: 400px; background: url(${PuzzleJs.LOGO}) no-repeat;`);
  }
}
