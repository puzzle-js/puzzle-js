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

  private static __pageConfiguration: IPageLibConfiguration | {} = {};

  @on(EVENT.ON_CONFIG)
  static config(pageConfiguration: string) {
    Core.__pageConfiguration = JSON.parse(pageConfiguration) as IPageLibConfiguration;
  }

  /**
   * Renders fragment
   * @param {string} fragmentName
   * @param {string} containerSelector
   * @param {string} replacementContentSelector
   */
  @on(EVENT.ON_FRAGMENT_RENDERED)
  static load(fragmentName: string, containerSelector: string, replacementContentSelector: string) {
    Core.__replace(containerSelector, replacementContentSelector);
  }

  @on(EVENT.ON_PAGE_LOAD)
  static pageLoaded() {

  }

  @on(EVENT.ON_VARIABLES)
  static onVariables(fragmentName: string, configKey: string, configData: string) {
    window[configKey] = JSON.parse(configData);
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
