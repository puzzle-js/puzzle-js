import {Module, ModuleConstructor} from "./module";

export class PuzzleJs {
  [name: string]: Module;

  constructor(){

  }

  inject(modules: {[name: string]: ModuleConstructor}){
    for(let name in modules){
      this[name] = new modules[name]();
    }
  }
}
