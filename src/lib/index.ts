import {PuzzleJs} from "./puzzle";
import {Core} from "./core";

(function () {
  const MODULES = {
    Core
  };


  PuzzleJs.inject(MODULES);
  window.PuzzleJs = PuzzleJs;
})();


