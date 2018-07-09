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
  static load(fragmentName: string, containerSelector: string, replacementContentSelector: string) {
    Core.__replace(containerSelector, replacementContentSelector);
  }

  @on(EVENT.ON_FRAGMENT_RENDERED)
  static loadAssetsOnFragment(fragmentName: string) {
    const onFragmentRenderAssets = Core.__pageConfiguration.assets.filter(asset => asset.fragment === fragmentName && asset.loadMethod === RESOURCE_LOADING_TYPE.ON_FRAGMENT_RENDER && !asset.preLoaded);

    const scripts = Core.createLoadQueue(onFragmentRenderAssets);
    scripts.map(async script => {
      await AssetHelper.loadJs(script);
    });
  }

  @on(EVENT.ON_PAGE_LOAD)
  static pageLoaded() {
    const onFragmentRenderAssets = Core.__pageConfiguration.assets.filter(asset => asset.loadMethod === RESOURCE_LOADING_TYPE.ON_PAGE_RENDER && !asset.preLoaded);

    const scripts = Core.createLoadQueue(onFragmentRenderAssets);
    scripts.map(async script => {
      await AssetHelper.loadJs(script);
    });
  }

  @on(EVENT.ON_VARIABLES)
  static onVariables(fragmentName: string, configKey: string, configData: string) {
    window[configKey] = JSON.parse(configData);
  }

  static createLoadQueue(assets: IPageLibAsset[]) {
    let loadList = [];

    assets.forEach(asset => {
      if (!asset.preLoaded) {
        asset.preLoaded = true;
        asset.defer = true;

        const dependencyList = asset.dependent ? asset.dependent.reduce((dependencyList, dependencyName) => {
          const dependency = Core.__pageConfiguration.dependencies.filter(dependency => dependency.name === dependencyName);
          if (dependency[0] && !dependency[0].preLoaded) {
            dependencyList.push(dependency[0]);
            dependency[0].preLoaded = true;
          }
          return dependencyList;
        }, []) : [];

        loadList = dependencyList.concat([asset]);
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
