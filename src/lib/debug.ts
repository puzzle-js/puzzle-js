import {PuzzleJs} from "./puzzle";
import {Core} from "./core";
import {Info} from "./modules/info";
import {Variables} from "./modules/variables";
import {Fragments} from "./modules/fragments";
import {Analytics} from "./modules/analytics";
import {Storage} from "./modules/storage";

(function () {
  const MODULES = {
    Core,
    Info,
    Variables,
    Fragments,
    Analytics,
    Storage
  };

  PuzzleJs.inject(MODULES);
  window.PuzzleJs = PuzzleJs;
})();
