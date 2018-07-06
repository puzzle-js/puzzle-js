import {Module} from "./module";
import {PuzzleJs} from "./puzzle";
import {EVENT} from "./enums";
import {IPageLibConfiguration} from "./types";
import {on} from "./decorators";

export class Core extends Module {
  static get _pageConfiguration() {
    return this.__pageConfiguration;
  }

  static set _pageConfiguration(value) {
    this.__pageConfiguration = value;
  }

  private static __pageConfiguration = {};

  static config(pageConfiguration: IPageLibConfiguration) {
    Core.__pageConfiguration = pageConfiguration;
  }

  /**
   * Renders fragment
   * @param {string} fragmentName
   * @param {string} containerSelector
   * @param {string} replacementContentSelector
   */
  @on(EVENT.ON_FRAGMENT_RENDERED)
  static load(fragmentName: string, containerSelector: string, replacementContentSelector: string) {
    this.__replace(containerSelector, replacementContentSelector);

    PuzzleJs.emit(EVENT.ON_FRAGMENT_RENDERED, fragmentName);
  }

  @on(EVENT.ON_PAGE_LOAD)
  static pageLoaded() {

  }

  @on(EVENT.ON_VARIABLES)
  static onVariables(key, model) {
    window[key] = model;
  }

  /**
   * Replaces container inner with given content.
   * @param {string} containerSelector
   * @param {string} replacementContentSelector
   */
  private static __replace(containerSelector: string, replacementContentSelector: string) {
    const z = window.document.querySelector(replacementContentSelector);
    const r = z.innerHTML;
    z.parentNode.removeChild(z);
    window.document.querySelector(containerSelector).innerHTML = r;
  }
}
