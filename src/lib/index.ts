import {PuzzleJs} from "./puzzle";
import {Core} from "./core";

(function () {
  const MODULES = {
    Core
  };

  window.PuzzleJs = new PuzzleJs();
  window.PuzzleJs.inject(MODULES);
})();


