import { FragmentStorefront } from "./fragment";
import {ICookieMap, IWrappingJsAsset} from "./types";
import {EVENT, RESOURCE_LOADING_TYPE, RESOURCE_TYPE} from "./lib/enums";
import {IPageFragmentConfig, IPageLibAsset, IPageLibConfiguration, IPageLibDependency} from "./lib/types";
import ResourceFactory from "./resourceFactory";
import {RESOURCE_INJECT_TYPE, RESOURCE_JS_EXECUTE_TYPE} from "./enums";
import CleanCSS from "clean-css";

export default class AssetInjector {

    private fragments: { [name: string]: FragmentStorefront };
    private isDebugMode: boolean;
    private readonly cookies: ICookieMap;
    private readonly pageName: string | undefined;

    private fragmentFingerPrints: IPageFragmentConfig[];
    private assets: IPageLibAsset[];
    private dependencies: IPageLibDependency[];
    private libraryConfig: IPageLibConfiguration;

    constructor(fragments: { [name: string]: FragmentStorefront }, cookies: ICookieMap, pageName: string | undefined, isDebugMode: boolean = false) {
        this.fragments = fragments;
        this.cookies = cookies;
        this.pageName = pageName;
        this.isDebugMode = isDebugMode;

        this.fragmentFingerPrints = [];
        this.assets = [];
        this.dependencies = [];
    }

    prepare() {
        Object.keys(this.fragments).forEach( (fragmentName) => {
            const fragment = this.fragments[fragmentName];
            this.fragmentFingerPrints.push(AssetInjector.getFragmentFingerPrint(fragment));
            Array.prototype.push.apply(this.assets, this.getAssets(fragment, fragmentName));
            Array.prototype.push.apply(this.dependencies, this.getDependencies(fragment));
        });
        this.libraryConfig = {
            page: this.pageName,
            fragments: this.fragmentFingerPrints,
            assets: this.assets.filter(asset => asset.type === RESOURCE_TYPE.JS), //css handled by merge cleaning
            dependencies: this.dependencies
        } as IPageLibConfiguration;
    }

    injectAssets(dom) {
        this.assets.forEach(asset => {
            if (asset.loadMethod === RESOURCE_LOADING_TYPE.ON_RENDER_START) {
                asset.preLoaded = true;
                if (asset.dependent && asset.dependent.length > 0) {
                    this.dependencies.forEach(dependency => {
                        if (asset.dependent && asset.dependent.indexOf(dependency.name) > -1 && !dependency.preLoaded) {
                            dependency.preLoaded = true;
                            if (dependency.type === RESOURCE_TYPE.JS) {
                                dom('body').append(AssetInjector.wrapJsAsset({
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
                    dom('body').append(AssetInjector.wrapJsAsset({
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

    injectLibraryConfig(dom: CheerioStatic) {
        dom('head').prepend(AssetInjector.wrapJsAsset({
            content: `{puzzleLibContent}PuzzleJs.emit('${EVENT.ON_RENDER_START}');PuzzleJs.emit('${EVENT.ON_CONFIG}','${JSON.stringify(this.libraryConfig)}');`,
            injectType: RESOURCE_INJECT_TYPE.INLINE,
            name: 'puzzle-lib',
            link: '',
            executeType: RESOURCE_JS_EXECUTE_TYPE.SYNC
        }));
    }

    /**
     * Merges, minifies stylesheets and inject them into a page
     * @returns {Promise<void>}
     */
    public async injectStyleSheets(dom: CheerioStatic,precompile: boolean) {
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
                if (!fragment.config) continue;

                const targetVersion = fragment.detectVersion(this.cookies, precompile);
                const fragmentVersion = this.getFragmentConfig(fragment);


                const cssAssets = fragmentVersion.assets.filter(asset => asset.type === RESOURCE_TYPE.CSS);
                const cssDependencies = fragmentVersion.dependencies.filter(dependency => dependency.type === RESOURCE_TYPE.CSS);

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

    // TODO: We can move this method to FragmentStorefront fragment.getConfig(cookie) etc..
    getFragmentConfig(fragment) {
        const config = fragment.config;
        if(this.cookies[config.testCookie] && config.passiveVersions && config.passiveVersions[this.cookies[config.testCookie]]) {
            return config.passiveVersions[this.cookies[config.testCookie]];
        }
        return config;
    }

    // TODO: check if fragmentName eq fragment.name and remove fragmentName param
    getAssets(fragment, fragmentName): IPageLibAsset[] {
        if(!fragment.config) return [];
        const assets: IPageLibAsset[] = [];
        const config =this.getFragmentConfig(fragment);
        config.assets.forEach((asset) => {
            assets.push({
                fragment: fragmentName,
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

    getDependencies(fragment): IPageLibDependency[] {
        if(!fragment.config) return [];
        const dependencies: IPageLibDependency[] = [];
        const config = this.getFragmentConfig(fragment);
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

    static getFragmentFingerPrint(fragment): IPageFragmentConfig {
        return {
            name: fragment.name,
            chunked: fragment.config ? (fragment.shouldWait || (fragment.config.render.static || false)) : false
        }
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

}
