import { FragmentStorefront } from "./fragment";
import {ICookieMap, IWrappingJsAsset} from "./types";
import {EVENT, RESOURCE_LOADING_TYPE, RESOURCE_TYPE} from "./lib/enums";
import {IPageFragmentConfig, IPageLibAsset, IPageLibConfiguration, IPageLibDependency} from "./lib/types";
import ResourceFactory from "./resourceFactory";
import {RESOURCE_INJECT_TYPE, RESOURCE_JS_EXECUTE_TYPE} from "./enums";
import CleanCSS from "clean-css";

export default class ResourceInjector {

    private readonly fragments: { [name: string]: FragmentStorefront };
    private readonly pageName: string | undefined;
    private readonly cookies: ICookieMap;

    private readonly fragmentFingerPrints: IPageFragmentConfig[];
    private readonly assets: IPageLibAsset[];
    private readonly dependencies: IPageLibDependency[];
    private libraryConfig: IPageLibConfiguration;

    constructor(fragments: { [name: string]: FragmentStorefront }, pageName:string | undefined, cookies: ICookieMap) {
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
            if (asset.loadMethod === RESOURCE_LOADING_TYPE.ON_RENDER_START) {
                asset.preLoaded = true;
                if (asset.dependent && asset.dependent.length > 0) {
                    this.dependencies.forEach(dependency => {
                        if (asset.dependent && asset.dependent.indexOf(dependency.name) > -1 && !dependency.preLoaded) {
                            dependency.preLoaded = true;
                            if (dependency.type === RESOURCE_TYPE.JS) {
                                dom('body').append(ResourceInjector.wrapJsAsset({
                                    content: ``,
                                    injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                                    name: dependency.name,
                                    link: dependency.link,
                                    executeType: RESOURCE_JS_EXECUTE_TYPE.SYNC
                                }));
                            }
                        }
                    });
                }
                if (asset.type === RESOURCE_TYPE.JS) {
                    dom('body').append(ResourceInjector.wrapJsAsset({
                        content: ``,
                        injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                        name: asset.name,
                        link: asset.link,
                        executeType: RESOURCE_JS_EXECUTE_TYPE.SYNC
                    }));
                }
            }
        });
    }

    /**
     * Injects library config to dom
     * @param { CheerioStatic } dom
     * @returns {Promise<void>}
     */
    injectLibraryConfig(dom: CheerioStatic) {
        dom('head').prepend(ResourceInjector.wrapJsAsset({
            content: `{puzzleLibContent}PuzzleJs.emit('${EVENT.ON_RENDER_START}');PuzzleJs.emit('${EVENT.ON_CONFIG}','${JSON.stringify(this.libraryConfig)}');`,
            injectType: RESOURCE_INJECT_TYPE.INLINE,
            name: 'puzzle-lib',
            link: '',
            executeType: RESOURCE_JS_EXECUTE_TYPE.SYNC
        }));
    }

    /**
     * Merges, minifies stylesheets and inject them to dom
     * @param { CheerioStatic } dom
     * @param { boolean } precompile
     * @returns {Promise<void>}
     */
    async injectStyleSheets(dom: CheerioStatic, precompile: boolean) {
        return new Promise(async (resolve) => {
            const _CleanCss = new CleanCSS({
                level: {
                    1: {
                        all: true
                    }
                }
            } as any);

            const styleSheets: string[] = [];
            const injectionDependencyNames: string[] = [];

            for (const fragment of Object.values(this.fragments)) {
                const targetVersion = fragment.detectVersion(this.cookies, precompile);
                const config = this.getFragmentConfig(fragment, targetVersion);
                if(!config) continue;

                const cssAssets = config.assets.filter(asset => asset.type === RESOURCE_TYPE.CSS);
                const cssDependencies = config.dependencies.filter(dependency => dependency.type === RESOURCE_TYPE.CSS);

                for (const asset of cssAssets) {
                    const assetContent = await fragment.getAsset(asset.name, targetVersion);

                    if (assetContent) {
                        styleSheets.push(assetContent);
                        injectionDependencyNames.push(asset.name);
                    }
                }

                for (const dependency of cssDependencies) {
                    if (!injectionDependencyNames.includes(dependency.name)) {
                        injectionDependencyNames.push(dependency.name);
                        styleSheets.push(await ResourceFactory.instance.getRawContent(dependency.name));
                    }
                }
            }

            if (styleSheets.length > 0) {
                const output = _CleanCss.minify(styleSheets.join(''));
                const addEscapeCharacters = output.styles.replace(/content:"/g, 'content:"\\');
                dom('head').append(`<style puzzle-dependency="dynamic-css" dependency-list="${injectionDependencyNames.join(',')}">${addEscapeCharacters}</style>`);
            }
            resolve();
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
     * Returns fragment config using targeted version
     * @param { FragmentStorefront } fragment
     * @param { string } targetVersion
     * @returns { }
     */
    private getFragmentConfig(fragment: FragmentStorefront, targetVersion: string) {
        if(!fragment.config) return;
        if(fragment.config.version === targetVersion || !fragment.config.passiveVersions || !fragment.config.passiveVersions[targetVersion]) {
            return fragment.config;
        }
        return fragment.config.passiveVersions[targetVersion];
    }

    /**
     * Prepare assets, fragmentFingerPrints, dependencies and library config
     * @returns {Promise<void>}
     */
    private prepare() {
        for(let fragment of Object.values(this.fragments)) {
            if (!fragment.config) continue;
            const targetVersion = fragment.detectVersion(this.cookies);
            const config = this.getFragmentConfig(fragment, targetVersion);
            this.fragmentFingerPrints.push(ResourceInjector.getFragmentFingerPrint(fragment));
            Array.prototype.push.apply(this.assets, this.getAssets(config));
            Array.prototype.push.apply(this.dependencies, this.getDependencies(config));
        }
        this.libraryConfig = {
            page: this.pageName,
            fragments: this.fragmentFingerPrints,
            assets: this.assets.filter(asset => asset.type === RESOURCE_TYPE.JS),
            dependencies: this.dependencies
        } as IPageLibConfiguration;
    }

    /**
     * Returns injectable assets
     * @param { } config
     * @returns {Promise<void>}
     */
    private getAssets(config): IPageLibAsset[] {
        const assets: IPageLibAsset[] = [];
        config.assets.forEach((asset) => {
            assets.push({
                loadMethod: typeof asset.loadMethod !== 'undefined' ? asset.loadMethod : RESOURCE_LOADING_TYPE.ON_PAGE_RENDER,
                name: asset.name,
                dependent: asset.dependent || [],
                type: asset.type,
                link: asset.link,
                preLoaded: false
            });
        });
        return assets;
    }

    /**
     * Returns injectable dependencies
     * @param { } config
     * @returns {IPageFragmentConfig}
     */
    private getDependencies(config): IPageLibDependency[] {
        const dependencies: IPageLibDependency[] = [];
        config.dependencies.forEach(dependency => {
            const dependencyData = ResourceFactory.instance.get(dependency.name);
            if (dependencyData && dependencyData.link && !dependencies.find(dependency => dependency.name === dependencyData.name)) {
                dependencies.push({
                    name: dependency.name,
                    link: dependencyData.link,
                    type: dependency.type,
                    preLoaded: false
                });
            }
        });
        return dependencies;
    }

    /**
     * Returns fragment fingerprint from given fragment
     * @param {FragmentStorefront} fragment
     * @returns {IPageFragmentConfig}
     */
    private static getFragmentFingerPrint(fragment: FragmentStorefront): IPageFragmentConfig {
        return {
            name: fragment.name,
            chunked: fragment.config ? (fragment.shouldWait || (fragment.config.render.static || false)) : false
        }
    }
}
