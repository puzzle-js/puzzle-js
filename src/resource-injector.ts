import {FragmentStorefront} from "./fragment";
import {ICookieMap, IWrappingJsAsset} from "./types";
import {EVENT, RESOURCE_LOADING_TYPE, RESOURCE_TYPE} from "@puzzle-js/client-lib/dist/enums";
import {
  IPageFragmentConfig,
  IPageLibAsset,
  IPageLibConfiguration,
  IPageLibDependency
} from "@puzzle-js/client-lib/dist/types";
import ResourceFactory from "./resourceFactory";
import {RESOURCE_INJECT_TYPE, RESOURCE_JS_EXECUTE_TYPE} from "./enums";
import CleanCSS from "clean-css";
import {EXTERNAL_STYLE_SHEETS, PEERS, PUZZLE_DEBUGGER_LINK, PUZZLE_LIB_LINK} from "./config";

export default class ResourceInjector {

  private readonly fragments: { [name: string]: FragmentStorefront };
  private readonly pageName: string | undefined;
  private readonly cookies: ICookieMap;

  private readonly fragmentFingerPrints: IPageFragmentConfig[];
  private readonly assets: IPageLibAsset[];
  private readonly dependencies: IPageLibDependency[];
  private libraryConfig: IPageLibConfiguration;

  constructor(fragments: { [name: string]: FragmentStorefront }, pageName: string | undefined, cookies: ICookieMap) {
    this.fragments = fragments;
    this.cookies = cookies;

    this.fragmentFingerPrints = [];
    this.assets = [];
    this.dependencies = [];
    this.pageName = pageName;

    this.prepare();
  }

  /**
   * Injects prepared assets to dom
   * @param { CheerioStatic } dom
   * @returns {Promise<void>}
   */
  injectAssets(dom: CheerioStatic) {
    this.assets.forEach(asset => {
      if (asset.type === RESOURCE_TYPE.JS && asset.loadMethod === RESOURCE_LOADING_TYPE.ON_RENDER_START) {
        asset.preLoaded = true;
        if (Array.isArray(asset.dependent) && asset.dependent.length > 0) {
          this.dependencies.forEach(dependency => {
            if (dependency.type === RESOURCE_TYPE.JS && Array.isArray(asset.dependent) && asset.dependent.indexOf(dependency.name) > -1 && !dependency.preLoaded) {
              dependency.preLoaded = true;
              ResourceInjector.injectDefaultJsAsset(dependency, dom);
            }
          });
        }
        ResourceInjector.injectDefaultJsAsset(asset, dom);
      }
    });
  }

  /**
   * Injects prepared dependencies to dom
   * @param { CheerioStatic } dom
   * @returns {Promise<void>}
   */
  injectDependencies(dom: CheerioStatic) {
    this.dependencies.forEach(dependency => {
      if (dependency.type === RESOURCE_TYPE.JS && dependency.loadMethod === RESOURCE_LOADING_TYPE.ON_RENDER_START) {
        const library = ResourceInjector.wrapJsAsset({
          link: dependency.link,
          name: dependency.name,
          injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
          executeType: RESOURCE_JS_EXECUTE_TYPE.SYNC,
          content: ''
        });

        dom('head').prepend(library);
      }
    });
  }

  /**
   * Injects library config to dom
   * @param { CheerioStatic } dom
   * @param isDebug
   * @returns {Promise<void>}
   */
  injectLibraryConfig(dom: CheerioStatic, isDebug = false) {
    const library = ResourceInjector.wrapJsAsset({
      link: isDebug ? PUZZLE_DEBUGGER_LINK : PUZZLE_LIB_LINK,
      name: 'puzzle-lib',
      injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
      executeType: RESOURCE_JS_EXECUTE_TYPE.SYNC,
      content: ''
    });
    const libraryConfig = ResourceInjector.wrapJsAsset({
      content: `PuzzleJs.emit('${EVENT.ON_RENDER_START}');PuzzleJs.emit('${EVENT.ON_CONFIG}','${JSON.stringify(this.libraryConfig)}');`,
      injectType: RESOURCE_INJECT_TYPE.INLINE,
      name: 'puzzle-lib-config',
      link: '',
      executeType: RESOURCE_JS_EXECUTE_TYPE.SYNC
    });

    dom('head').prepend(libraryConfig);
    dom('head').prepend(library);
  }

  /**
   * Merges, minifies stylesheets and inject them to dom
   * @param { CheerioStatic } dom
   * @param { boolean } precompile
   * @returns {Promise<void>}
   */
  async injectStyleSheets(dom: CheerioStatic, precompile: boolean) {
    return new Promise(async (resolve) => {
      if (!EXTERNAL_STYLE_SHEETS) {
        const _CleanCss = new CleanCSS({
          level: {
            1: {
              all: true
            }
          }
        } as any);

        const cssData: Record<string, string[]> = {
          styleSheets: [],
          dependencyNames: []
        };

        for (const fragment of Object.values(this.fragments)) {
          await this.loadCSSData(cssData, fragment, precompile);
        }


        if (cssData.styleSheets.length > 0) {
          const output = _CleanCss.minify(cssData.styleSheets.join(''));
          const addEscapeCharacters = output.styles.replace(/content:"/g, 'content:"\\');
          dom('head').append(`<style puzzle-dependency="dynamic-css" dependency-list="${cssData.dependencyNames.join(',')}">${addEscapeCharacters}</style>`);
        }
        resolve(null);
      } else {
        const injectedStyles = new Set();
        for (const fragment of Object.values(this.fragments)) {
          const targetVersion = fragment.detectVersion(this.cookies, precompile);
          const config = this.getFragmentConfig(fragment, targetVersion);
          if (config) {
            config.dependencies.filter(dep => dep.type === RESOURCE_TYPE.CSS).forEach(dep => {
              if (!injectedStyles.has(dep.name)) {
                injectedStyles.add(dep.name);
                const dependency = ResourceFactory.instance.get(dep.name);
                if (dependency) {
                  dom('head').append(`<link rel="stylesheet" data-puzzle-dep="${dependency.name} "href="${dependency.link}" />`);
                }
              }
            });

            if (!fragment.clientAsync) {
              config.assets.filter(dep => dep.type === RESOURCE_TYPE.CSS).forEach(dep => {
                if (!injectedStyles.has(dep.name)) {
                  injectedStyles.add(dep.name);
                  dom('head').append(`<link rel="stylesheet" data-puzzle-dep="${dep.name} "href="${dep.link}" />`);
                }
              });
            }
          }
        }
        resolve(null);
      }
    });
  }

  /**
   * Merges, minifies critical stylesheets and inject them to dom
   * @param { CheerioStatic } dom
   * @param { boolean } precompile
   * @returns {Promise<void>}
   */
  async injectCriticalStyleSheets(dom: CheerioStatic, precompile: boolean) {
    return new Promise(async (resolve) => {
      if (!EXTERNAL_STYLE_SHEETS) {
        return resolve(null);
      }

      const _CleanCss = new CleanCSS({
        level: {
          1: {
            all: true
          }
        }
      } as any);

      const cssData: Record<string, string[]> = {
        styleSheets: [],
        dependencyNames: []
      };

      for (const fragment of Object.values(this.fragments)) {
        if (fragment.clientAsync && fragment.criticalCss) {
          await this.loadCSSData(cssData, fragment, precompile);
        }
      }


      if (cssData.styleSheets.length > 0) {
        const output = _CleanCss.minify(cssData.styleSheets.join(''));
        const addEscapeCharacters = output.styles.replace(/content:"/g, 'content:"\\');
        dom('head').append(`<style puzzle-dependency="dynamic-css" dependency-list="${cssData.dependencyNames.join(',')}">${addEscapeCharacters}</style>`);
      }
      resolve(null);
    });
  }

  /**
   * Wraps js asset based on its configuration
   * @param {IWrappingJsAsset} asset
   * @returns {string}
   */
  static wrapJsAsset(asset: IWrappingJsAsset) {
    if (asset.injectType === RESOURCE_INJECT_TYPE.EXTERNAL && asset.link) {
      return `<script puzzle-dependency="${asset.name}" src="${asset.link}" type="text/javascript"${asset.executeType}> </script>`;
    } else if (asset.injectType === RESOURCE_INJECT_TYPE.INLINE && asset.content) {
      return `<script puzzle-dependency="${asset.name}" type="text/javascript">${asset.content}</script>`;
    } else {
      //todo handle error
      return `<!-- Failed to inject asset: ${asset.name} -->`;
    }
  }

  /**
   * Load css data(stylesheets and dependency name list) and push to first parameter
   * @param { } cssData
   * @param {FragmentStorefront} fragment
   * @param {boolean} precompile
   * @returns {Promise<>}
   */
  private async loadCSSData(cssData: { [name: string]: string[] }, fragment: FragmentStorefront, precompile: boolean) {
    const targetVersion = fragment.detectVersion(this.cookies, precompile);
    const config = this.getFragmentConfig(fragment, targetVersion);
    if (config && !this.asyncCssAssetsLoadEnabled(fragment)) {
      const cssAssets = config.assets.filter(asset => asset.type === RESOURCE_TYPE.CSS);
      const cssDependencies = config.dependencies.filter(dependency => dependency.type === RESOURCE_TYPE.CSS);

      for (const asset of cssAssets) {
        const assetContent = await fragment.getAsset(asset.name, targetVersion);
        if (assetContent) {
          cssData.styleSheets.push(assetContent.toString());
          cssData.dependencyNames.push(asset.name);
        }
      }

      for (const dependency of cssDependencies) {
        if (!cssData.dependencyNames.includes(dependency.name)) {
          cssData.dependencyNames.push(dependency.name);
          cssData.styleSheets.push(await ResourceFactory.instance.getRawContent(dependency.name));
        }
      }
    }
  }

  /**
   * Returns fragment config using targeted version
   * @param { FragmentStorefront } fragment
   * @param { string } targetVersion
   * @returns { }
   */
  private getFragmentConfig(fragment: FragmentStorefront, targetVersion: string) {
    if (!fragment.config) return;
    if (fragment.config.version === targetVersion || !fragment.config.passiveVersions || !fragment.config.passiveVersions[targetVersion]) {
      return fragment.config;
    }
    return fragment.config.passiveVersions[targetVersion];
  }

  /**
   * Prepare assets, fragmentFingerPrints, dependencies and library config
   * @returns {Promise<void>}
   */
  private prepare() {
    for (const fragment of Object.values(this.fragments)) {
      if (!fragment.config) continue;
      const targetVersion = fragment.detectVersion(this.cookies);
      const config = this.getFragmentConfig(fragment, targetVersion);
      this.prepareFragmentFingerPrint(fragment);
      this.prepareAssets(config, fragment);
      this.prepareDependencies(config);
    }
    this.libraryConfig = {
      page: this.pageName,
      fragments: this.fragmentFingerPrints,
      assets: this.assets,
      dependencies: this.dependencies.filter((dependency) => dependency.type === RESOURCE_TYPE.JS && dependency.loadMethod !== RESOURCE_LOADING_TYPE.ON_RENDER_START),
      peers: PEERS
    } as IPageLibConfiguration;
  }

  /**
   * Prepare injectable assets from fragment and push to this.assets
   * @param { } config
   * @param fragment
   */
  private prepareAssets(config, fragment: FragmentStorefront) {
    config.assets.forEach((asset) => {
      if (asset.type === RESOURCE_TYPE.CSS && !this.asyncCssAssetsLoadEnabled(fragment)) {
        return;
      }

      this.assets.push({
        loadMethod: typeof asset.loadMethod !== 'undefined' ? asset.loadMethod : RESOURCE_LOADING_TYPE.ON_PAGE_RENDER,
        name: asset.name,
        dependent: asset.dependent || [],
        type: asset.type,
        fragment: fragment.name,
        link: asset.link,
        preLoaded: false
      });
    });
  }

  /**
   * Prepare injectable dependencies from fragment and push to this.dependencies
   * @param { } config
   * @returns {IPageFragmentConfig}
   */
  private prepareDependencies(config) {
    config.dependencies.forEach(dependency => {
      const dependencyData = ResourceFactory.instance.get(dependency.name);
      if (dependencyData && dependencyData.link && !this.dependencies.find(dependency => dependency.name === dependencyData.name)) {
        this.dependencies.push({
          name: dependency.name,
          link: dependencyData.link,
          type: dependency.type,
          preLoaded: false,
          loadMethod: dependencyData.loadMethod
        });
      }
    });
  }

  /**
   * Prepare fragment fingerprint from given fragment and push to this.fragmentFingerPrints
   * @param {FragmentStorefront} fragment
   */
  private prepareFragmentFingerPrint(fragment: FragmentStorefront) {
    this.fragmentFingerPrints.push({
      name: fragment.name,
      chunked: fragment.config ? (fragment.shouldWait || (fragment.config.render.static || false)) : false,
      clientAsync: fragment.clientAsync,
      clientAsyncForce: fragment.clientAsyncForce,
      criticalCss: fragment.criticalCss,
      onDemand: fragment.onDemand,
      asyncDecentralized: fragment.asyncDecentralized,
      attributes: fragment.attributes,
      source: fragment.attributes['source'] || fragment.assetUrl || fragment.fragmentUrl
    });
  }

  /**
   * Checks that asynchronous css asset loading is enabled
   * @param fragment
   */
  private asyncCssAssetsLoadEnabled(fragment: FragmentStorefront): boolean {
    return fragment.clientAsync && !fragment.criticalCss;
  }

  /**
   * Inject default JS assets
   * @param { } jsAsset
   * @param { CheerioStatic } dom
   * @returns {string}
   */
  private static injectDefaultJsAsset(jsAsset: { type, name, link }, dom: CheerioStatic) {
    if (jsAsset.type === RESOURCE_TYPE.JS) {
      dom('body').append(ResourceInjector.wrapJsAsset({
        content: ``,
        injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
        name: jsAsset.name,
        link: jsAsset.link,
        executeType: RESOURCE_JS_EXECUTE_TYPE.SYNC
      }));
    }
  }
}
