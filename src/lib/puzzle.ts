import {Module, ModuleConstructor} from "./module";

export class PuzzleJs {
  static PACKAGE_VERSION = '1.0.0';
  static DEPENDENCIES = [];
  static LOGO = 'https://image.ibb.co/jM29on/puzzlelogo.png';

  constructor(){

  }

  inject(modules: {[name: string]: ModuleConstructor}){
    for(let name in modules){
      this[name] = new modules[name]();
    }
  }
}
