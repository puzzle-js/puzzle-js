import {Module, ModuleConstructor} from "./module";
import {EVENT} from "./enums";

export class PuzzleJs {
  [module: string]: object;

  static PACKAGE_VERSION = '';
  static DEPENDENCIES = {};
  static LOGO = '';

  private static __LISTENERS = {};

  static subscribe(event: EVENT, cb: Function) {
    if (!PuzzleJs.__LISTENERS[event]) {
      PuzzleJs.__LISTENERS[event] = [cb];
    } else {
      PuzzleJs.__LISTENERS[event].push(cb);
    }
  }

  static emit(event: EVENT, data) {
    if (PuzzleJs.__LISTENERS[event]) {
      for (let listener of PuzzleJs.__LISTENERS[event]) {
        listener(data);
      }
    }
  }

  inject(modules: { [name: string]: ModuleConstructor }) {
    for (let name in modules) {
      this[name] = new modules[name]();
    }
  }
}
