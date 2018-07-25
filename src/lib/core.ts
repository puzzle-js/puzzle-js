import {Module} from "./module";
import {EVENT, RESOURCE_LOADING_TYPE} from "./enums";
import {IPageLibAsset, IPageLibConfiguration} from "./types";
import {on} from "./decorators";
import {AssetHelper} from "./assetHelper";

export class Core extends Module {
  static get _pageConfiguration() {
    return this.__pageConfiguration;
  }

  static set _pageConfiguration(value) {
    this.__pageConfiguration = value;
  }

  private static __pageConfiguration: IPageLibConfiguration;

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
  static load(fragmentName: string, containerSelector?: string, replacementContentSelector?: string) {
    if (containerSelector && replacementContentSelector) {
      Core.__replace(containerSelector, replacementContentSelector);
    }
  }

  @on(EVENT.ON_FRAGMENT_RENDERED)
  static loadAssetsOnFragment(fragmentName: string) {
    const onFragmentRenderAssets = Core.__pageConfiguration.assets.filter(asset => asset.fragment === fragmentName && asset.loadMethod === RESOURCE_LOADING_TYPE.ON_FRAGMENT_RENDER && !asset.preLoaded);

    const scripts = Core.createLoadQueue(onFragmentRenderAssets);

    AssetHelper.loadJsSeries(scripts);
  }

  @on(EVENT.ON_PAGE_LOAD)
  static pageLoaded() {
    const onFragmentRenderAssets = Core.__pageConfiguration.assets.filter(asset => asset.loadMethod === RESOURCE_LOADING_TYPE.ON_PAGE_RENDER && !asset.preLoaded);

    const scripts = Core.createLoadQueue(onFragmentRenderAssets);

    AssetHelper.loadJsSeries(scripts);
  }

  @on(EVENT.ON_VARIABLES)
  static onVariables(fragmentName: string, configKey: string, configData: object) {
    window[configKey] = configData;
  }

  static createLoadQueue(assets: IPageLibAsset[]) {
    let loadList = [];

    assets.forEach(asset => {
      if (!asset.preLoaded) {
        asset.preLoaded = true;
        asset.defer = true;

        asset.dependent && asset.dependent.forEach((dependencyName) => {
          const dependency = Core.__pageConfiguration.dependencies.filter(dependency => dependency.name === dependencyName);
          if (dependency[0] && !dependency[0].preLoaded) {
            if (loadList.indexOf(dependency[0]) === -1) {
              loadList.push(dependency[0]);
              dependency[0].preLoaded = true;
            }
          }
        });

        if (loadList.indexOf(asset) === -1) {
          loadList.push(asset);
        }
      }
    });

    return loadList;
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
