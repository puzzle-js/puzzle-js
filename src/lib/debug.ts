import {PuzzleJs} from "./puzzle";
import {Core} from "./core";
import {Info} from "./modules/info";

(function () {
  const MODULES = {
    Info,
    Core
  };

  window.PuzzleJs = new PuzzleJs();
  window.PuzzleJs.inject(MODULES);
})();


