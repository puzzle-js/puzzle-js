import {Module, ModuleConstructor} from "./module";
import {EVENT} from "./enums";

export class PuzzleJs {
  static PACKAGE_VERSION = '1.0.0';
  static DEPENDENCIES = [];
  static LOGO = 'https://image.ibb.co/jM29on/puzzlelogo.png';
  
  private static __LISTENERS = {};

  static subscribe(event: EVENT, cb: Function) {
    if (!PuzzleJs.__LISTENERS[event]) {
      PuzzleJs.__LISTENERS[event] = [cb];
    } else {
      PuzzleJs.__LISTENERS[event].push(cb);
    }
  }

  inject(modules: { [name: string]: ModuleConstructor }) {
    for (let name in modules) {
      this[name] = new modules[name]();
    }
  }
}
