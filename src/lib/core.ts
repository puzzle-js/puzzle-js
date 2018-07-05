import {Module} from "./module";
import {PuzzleJs} from "./puzzle";
import {EVENT} from "./enums";

export class Core extends Module {
  constructor(){
   super();

   PuzzleJs.subscribe(EVENT.ON_PAGE_LOAD, this.loadScripts.bind(this));
  }

  /**
   * Renders fragment
   * @param {string} fragmentName
   * @param {string} containerSelector
   * @param {string} replacementContentSelector
   */
  load(fragmentName: string, containerSelector: string, replacementContentSelector: string) {
    this.replace(containerSelector, replacementContentSelector);

    PuzzleJs.emit(EVENT.ON_FRAGMENT_RENDERED, fragmentName);
  }

  /**
   * Replaces container with given content
   * @param {string} containerSelector
   * @param {string} replacementContentSelector
   */
  private replace(containerSelector: string, replacementContentSelector: string) {
    const z = document.querySelector(replacementContentSelector);
    const r = z.innerHTML;
    z.parentNode.removeChild(z);
    document.querySelector(containerSelector).innerHTML = r;
  }

  /**
   * Loads page assets
   */
  private loadScripts(){

  }
}
