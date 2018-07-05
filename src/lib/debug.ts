import {PuzzleJs} from "./puzzle";
import {Core} from "./core";
import {Info} from "./modules/info";
import {Variables} from "./modules/variables";

(function () {
  const MODULES = {
    Core,
    Info,
    Variables
  };

  window.PuzzleJs = new PuzzleJs();
  window.PuzzleJs.inject(MODULES);
})();


