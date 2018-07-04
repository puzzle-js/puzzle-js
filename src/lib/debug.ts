import {PuzzleJs} from "./puzzle";
import {Util} from "./util";
import {Core} from "./core";


declare global {
  interface Window {
    PuzzleJs: PuzzleJs;
  }
}

(function () {
  const MODULES = {
    Util,
    Core
  };

  window.PuzzleJs = new PuzzleJs();
  window.PuzzleJs.inject(MODULES);
})();


