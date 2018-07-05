import {LOG_COLORS, LOG_TYPES} from "./enums";

export class Util {
  static wrapGroup(name: string, description: string, fn: Function, color: LOG_COLORS = LOG_COLORS.GREEN) {
    const logConfig = (name: string, color: LOG_COLORS) => ['%c' + name, `background: ${color}; color: white; padding: 2px 0.5em; ` + `border-radius: 0.5em;`];
    window.console.groupCollapsed(...logConfig(name, color), description);
    fn();
    window.console.groupEnd();
  }

  static log(content: any, type: LOG_TYPES = LOG_TYPES.INFO, color: LOG_COLORS = LOG_COLORS.BLUE) {
    const logConfig = color => ['%cPuzzleJs', `background: ${color}; color: white; padding: 2px 0.5em; ` + `border-radius: 0.5em;`];
    window.console[type](...logConfig(color), content);
  }

  static table(content: object) {
    window.console.table(content);
  }
}
