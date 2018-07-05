import {Module} from "./module";
import {PuzzleJs} from "./puzzle";
import {EVENT} from "./enums";
import {IPageLibConfiguration} from "./types";
import {on} from "./decorators";

export class Core extends Module {
  get pageConfiguration(): IPageLibConfiguration {
    return this._pageConfiguration;
  }

  set pageConfiguration(value: IPageLibConfiguration) {
    this._pageConfiguration = value;
  }

  private _pageConfiguration: IPageLibConfiguration;

  config(pageConfiguration: IPageLibConfiguration) {
    this.pageConfiguration = pageConfiguration;
  }

  /**
   * Renders fragment
   * @param {string} fragmentName
   * @param {string} containerSelector
   * @param {string} replacementContentSelector
   */
  @on(EVENT.ON_FRAGMENT_RENDERED)
  load(fragmentName: string, containerSelector: string, replacementContentSelector: string) {
    this.replace(containerSelector, replacementContentSelector);

    PuzzleJs.emit(EVENT.ON_FRAGMENT_RENDERED, fragmentName);
  }

  /**
   * Replaces container inner with given content.
   * @param {string} containerSelector
   * @param {string} replacementContentSelector
   */
  private replace(containerSelector: string, replacementContentSelector: string) {
    const z = window.document.querySelector(replacementContentSelector);
    const r = z.innerHTML;
    z.parentNode.removeChild(z);
    window.document.querySelector(containerSelector).innerHTML = r;
  }

  @on(EVENT.ON_PAGE_LOAD)
  private pageLoaded() {

  }
}
