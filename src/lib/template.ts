import {FragmentStorefront} from "./fragment";
import cheerio from "cheerio";
import {TemplateCompiler} from "./templateCompiler";
import {CONTENT_NOT_FOUND_ERROR} from "./config";
import {IPageDependentGateways} from "../types/page";
import async from "async";
import {IReplaceAsset, IReplaceItem, IReplaceSet, IReplaceAssetSet} from "../types/template";
import {
    CONTENT_REPLACE_SCRIPT,
    REPLACE_ITEM_TYPE,
    RESOURCE_INJECT_TYPE,
    RESOURCE_LOCATION,
    RESOURCE_TYPE
} from "./enums";
import {IfragmentContentResponse} from "../types/fragment";
import ResourceFactory from "./resourceFactory";
import {IFileResourceAsset} from "../types/resource";
import CleanCSS from "clean-css";


export class TemplateClass {
    onCreate: Function | undefined;
    onRequest: Function | undefined;
    onChunk: Function | undefined;
    onResponseEnd: Function | undefined;

    _onCreate(...args: any[]) {
        this.onCreate && this.onCreate(...args);
    }

    _onRequest(...args: any[]) {
        this.onRequest && this.onRequest(...args);
    }

    _onChunk(...args: any[]) {
        this.onChunk && this.onChunk(...args);
    }

    _onResponseEnd(...args: any[]) {
        this.onResponseEnd && this.onResponseEnd(...args);
    }

    [name: string]: any;
}

export class Template {
    dom: CheerioStatic;
    fragments: { [name: string]: FragmentStorefront } = {};
    pageClass: TemplateClass = new TemplateClass();

    constructor(rawHtml: string) {
        this.dom = this.loadRawHtml(rawHtml);

        this.bindPageClass(rawHtml);

        this.pageClass._onCreate();
    }

    /**
     * Loads html template into Cheerio instance
     * @param {string} rawHtml
     * @returns {CheerioStatic}
     */
    private loadRawHtml(rawHtml: string) {
        const templateRegex = /<template>(.*?)<\/template>/mis;

        const templateMatch = templateRegex.exec(rawHtml);
        if (templateMatch) {
            return cheerio.load(templateMatch[1], {
                normalizeWhitespace: true,
                recognizeSelfClosing: true,
                xmlMode: true,
                lowerCaseAttributeNames: true,
            });
        } else {
            throw new Error('Template not found in html file');
        }
    }

    /**
     * Bind user class to page
     * @param {string} rawHtml
     */
    private bindPageClass(rawHtml: string) {
        const pageClassScriptRegex = /<script>(.*?)<\/script>(.*)<template>/mis;
        const scriptMatch = pageClassScriptRegex.exec(rawHtml);
        if (scriptMatch) {
            const pageClass = eval(scriptMatch[1]);
            pageClass.__proto__ = new TemplateClass();
            this.pageClass = pageClass;
        }
    }

    /**
     * Returns fragment dependencies
     * @returns {IPageDependentGateways}
     */
    getDependencies() {
        let primaryName: string | null = null;

        return this.dom('fragment').toArray().reduce((dependencyList: IPageDependentGateways, fragment: any) => {
            if (!dependencyList.gateways[fragment.attribs.from]) {
                dependencyList.gateways[fragment.attribs.from] = {
                    gateway: null,
                    ready: false
                };
            }

            if (!dependencyList.fragments[fragment.attribs.name]) {
                this.fragments[fragment.attribs.name] = new FragmentStorefront(fragment.attribs.name, fragment.attribs.from);
                dependencyList.fragments[fragment.attribs.name] = {
                    gateway: fragment.attribs.from,
                    instance: this.fragments[fragment.attribs.name]
                };
            }

            if (this.fragments[fragment.attribs.name].primary === false) {
                if (typeof fragment.attribs.primary !== 'undefined') {
                    if (primaryName != null && primaryName !== fragment.attribs.name) throw new Error('Multiple primary fragments are not allowed');
                    primaryName = fragment.attribs.name;
                    this.fragments[fragment.attribs.name].primary = true;
                    this.fragments[fragment.attribs.name].shouldWait = true;
                }
            }

            if (this.fragments[fragment.attribs.name].shouldWait === false) {
                this.fragments[fragment.attribs.name].shouldWait = typeof fragment.attribs.shouldwait !== 'undefined' || (fragment.parent && fragment.parent.name === 'head') || false;
            }


            return dependencyList;
        }, {
            gateways: {},
            fragments: {}
        });
    }

    //todo fragmentConfigleri versiyon bilgileriyle inmis olmali ki assetleri versionlara gore compile edebilelim. ayni not gatewayde de var.
    /**
     * Compiles template and returns a function that can handle the request.
     * @param {{[p: string]: string}} testCookies
     * @returns {Promise<(req: any, res: any) => void | (req: any, res: any) => void>}
     */
    async compile(testCookies: { [cookieName: string]: string }) {
        let firstFlushHandler: Function;

        const fragmentsShouldBeWaited = Object.values(this.fragments).filter(fragment => fragment.config && fragment.shouldWait);
        const chunkedFragments = Object.values(this.fragments).filter(fragment => fragment.config && !fragment.shouldWait && !fragment.config.render.static);
        const staticFragments = Object.values(this.fragments).filter(fragment => fragment.config && fragment.config.render.static);

        if (Object.keys(this.fragments).length === 0) {
            firstFlushHandler = TemplateCompiler.compile(this.clearHtmlContent(this.dom.html()));
            return this.buildHandler(firstFlushHandler, []);
        }


        const replaceScripts = await this.prepareJsAssetLocations();
        const waitedFragmentReplacements: IReplaceSet[] = this.replaceWaitedFragmentContainers(fragmentsShouldBeWaited, replaceScripts);
        const chunkReplacements: IReplaceSet[] = this.replaceChunkedFragmentContainers(chunkedFragments);
        this.replaceUnfetchedFragments(Object.values(this.fragments).filter(fragment => !fragment.config));
        this.addDependencies();

        await this.replaceStaticFragments(staticFragments);
        await this.appendPlaceholders(chunkReplacements);
        await this.buildStyleSheets();


        return this.buildHandler(TemplateCompiler.compile(this.clearHtmlContent(this.dom.html())), chunkReplacements, waitedFragmentReplacements, replaceScripts);
    }

    /**
     * Appends placeholders to fragment contents on vDOM
     * @param {{fragment: FragmentStorefront; replaceItems: IReplaceItem[]}[]} chunkedReplacements
     * @returns {Promise<any>}
     */
    private appendPlaceholders(chunkedReplacements: { fragment: FragmentStorefront, replaceItems: IReplaceItem[] }[]) {
        return new Promise((resolve, reject) => {
            async.each(chunkedReplacements, async (replacement, cb) => {
                const placeholders = replacement.replaceItems.filter(item => item.type === REPLACE_ITEM_TYPE.PLACEHOLDER);
                async.each(placeholders, async (placeholderReplacement, rpCb) => {
                    const placeholderContent = await replacement.fragment.getPlaceholder();
                    this.dom(`[puzzle-placeholder="${placeholderReplacement.key}"]`).append(placeholderContent);
                    rpCb();
                }, cb);
            }, resolve);
        });
    }

    /**
     * Replaces static fragments with their content on vDOM
     * @param {FragmentStorefront[]} fragments
     * @returns {Promise<any>}
     */
    private replaceStaticFragments(fragments: FragmentStorefront[]) {
        return new Promise((resolve, reject) => {
            async.each(fragments, async (fragment: FragmentStorefront, cb) => {
                const fragmentContent: IfragmentContentResponse = await fragment.getContent();
                this.dom(`fragment[name="${fragment.name}"][from="${fragment.from}"]`).each((i, element) => {
                    const partial = this.dom(element).attr('partial') || 'main';
                    this.dom(element).replaceWith(`<div puzzle-fragment="${fragment.name}" puzzle-gateway="${fragment.from}" fragment-partial="${element.attribs.partial || 'main'}">${fragmentContent.html[partial] || CONTENT_NOT_FOUND_ERROR}</div>`);
                });
                cb();
            }, err => {
                if (err) {
                } //handle
                resolve();
            });
        });
    }

    /**
     * Replaces waited fragments with their content on first flush string.
     * @param {IReplaceSet[]} waitedFragments
     * @param {string} output
     * @param {Function} cb
     */
    private replaceWaitedFragments(waitedFragments: IReplaceSet[], output: string, cb: Function) {
        let statusCode = 200;
        async.each(waitedFragments, async (waitedFragmentReplacement, cb) => {
            const fragmentContent = await waitedFragmentReplacement.fragment.getContent(waitedFragmentReplacement.fragmentAttributes);
            if (waitedFragmentReplacement.fragment.primary) {
                statusCode = fragmentContent.status;
            }
            waitedFragmentReplacement.replaceItems
                .forEach(replaceItem => {
                    if (replaceItem.type === REPLACE_ITEM_TYPE.CONTENT) {
                        let fragmentInject = ``;
                        // const fragmentReplacements = jsReplacements.find(replacement => replacement.fragment.name === waitedFragmentReplacement.fragment.name);

                        //todo fragment replace error selfReplace patlar cok cok onemli
                        // fragmentReplacements && fragmentReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_START).forEach(replaceItem => {
                        //     fragmentInject += Template.wrapJsAsset(replaceItem);
                        // });

                        fragmentInject += fragmentContent.html[replaceItem.partial] || CONTENT_NOT_FOUND_ERROR;

                        // fragmentReplacements && fragmentReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_END).forEach(replaceItem => {
                        //     fragmentInject += Template.wrapJsAsset(replaceItem);
                        // });

                        output = output.replace(replaceItem.key, fragmentInject);
                    }
                });
            cb();
        }, err => {
            //if (err) //todo handle error
            cb({output, status: statusCode});
        });
    }

    /**
     * Creates a request handler from the compilation output. Express requests drops to return of this method
     * @param {Function} firstFlushHandler
     * @param {IReplaceSet[]} chunkedFragmentReplacements
     * @param {IReplaceSet[]} waitedFragments
     * @returns {(req: any, res: any) => void}
     */
    private buildHandler(firstFlushHandler: Function, chunkedFragmentReplacements: IReplaceSet[], waitedFragments: IReplaceSet[] = [], jsReplacements: IReplaceAsset[] = []) {
        //todo primary fragment test et
        if (chunkedFragmentReplacements.length === 0) {
            return (req: any, res: any) => {
                this.pageClass._onRequest(req);
                let fragmentedHtml = firstFlushHandler.call(this.pageClass, req);
                this.replaceWaitedFragments(waitedFragments, fragmentedHtml, (flush: { output: string, status: number }) => {
                    res.status(flush.status).end(flush.output);
                    this.pageClass._onResponseEnd();
                });
            };
        } else {
            return (req: any, res: any) => {
                this.pageClass._onRequest(req);
                let fragmentedHtml = firstFlushHandler.call(this.pageClass, req).replace('</body>', '').replace('</html>', '');
                res.set('transfer-encoding', 'chunked');
                res.set('content-type', 'text/html; charset=UTF-8');
                this.replaceWaitedFragments(waitedFragments, fragmentedHtml, (firstFlush: { output: string, status: number }) => {
                    res.status(firstFlush.status).write(firstFlush.output);
                    async.each(chunkedFragmentReplacements, async (chunkedReplacement, cb) => {
                        if (chunkedReplacement.fragment.config) {
                            const fragmentContent = await chunkedReplacement.fragment.getContent(chunkedReplacement.fragmentAttributes);
                            const fragmentJsReplacements = jsReplacements.find(jsReplacement => jsReplacement.fragment.name === chunkedReplacement.fragment.name);
                            const selfReplacing = chunkedReplacement.fragment.config.render.selfReplace;

                            let output = ``;

                            fragmentJsReplacements && fragmentJsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_START).forEach(replaceItem => {
                                output += Template.wrapJsAsset(replaceItem);
                            });

                            chunkedReplacement.replaceItems
                                .forEach(replaceItem => {
                                    if (replaceItem.type === REPLACE_ITEM_TYPE.CHUNKED_CONTENT) {
                                        output += `<div style="display: none;" puzzle-fragment="${chunkedReplacement.fragment.name}" puzzle-chunk-key="${replaceItem.key}">${fragmentContent.html[replaceItem.partial] || CONTENT_NOT_FOUND_ERROR}</div>`;
                                        if (!(replaceItem.key === 'main' && selfReplacing)) {
                                            output += `<script>$p('[puzzle-chunk="${replaceItem.key}"]','[puzzle-chunk-key="${replaceItem.key}"]');</script>`;
                                        }
                                    }
                                });

                            fragmentJsReplacements && fragmentJsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_END).forEach(replaceItem => {
                                output += Template.wrapJsAsset(replaceItem);
                            });


                            this.pageClass._onChunk(output);
                            res.write(output);
                        }
                        cb();
                    }, (err) => {
                        let bodyAndAssets = ``;

                        jsReplacements.forEach(replacement => {
                            replacement.replaceItems.filter(item => item.location === RESOURCE_LOCATION.BODY_END).forEach(replaceItem => {
                                bodyAndAssets += Template.wrapJsAsset(replaceItem);
                            });
                        });

                        res.end(`${bodyAndAssets}</body></html>`);
                        this.pageClass._onResponseEnd();
                    });
                });
            };
        }
    }

    /**
     * Clears html content from empty spaces
     * @param {string} str
     * @returns {string}
     */
    private clearHtmlContent(str: string) {
        return str.replace(/>\s+</g, "><").trim();
    }

    /**
     * Replaces unfetched fragments with empty div error
     * @param {FragmentStorefront[]} fragments
     */
    private replaceUnfetchedFragments(fragments: FragmentStorefront[]) {
        fragments.forEach(fragment => {
            this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`).replaceWith(`<div puzzle-fragment="${fragment.name}" puzzle-gateway="${fragment.from}">${CONTENT_NOT_FOUND_ERROR}</div>`);
        });
    }

    /**
     * Adds required dependencies
     */
    private addDependencies() {
        let injectedDependencies: string[] = [];
        Object.values(this.fragments).forEach(fragment => {
            if (fragment.config) {
                fragment.config.dependencies.forEach(dependency => {
                    if (injectedDependencies.indexOf(dependency.name) == -1) {
                        injectedDependencies.push(dependency.name);
                        this.dom('head').append(ResourceFactory.instance.getDependencyContent(dependency.name));
                    }
                });
            }
        });
    }

    /**
     * Creates chunked fragment containers
     * @param {FragmentStorefront[]} chunkedFragments
     * @returns {IReplaceSet[]}
     */
    private replaceChunkedFragmentContainers(chunkedFragments: FragmentStorefront[]) {
        const chunkReplacements: IReplaceSet[] = [];

        if (chunkedFragments.length > 0) {
            this.dom('head').append(CONTENT_REPLACE_SCRIPT);
        }

        chunkedFragments.forEach(fragment => {
            let replaceItems: IReplaceItem[] = [];
            let fragmentAttributes = {};
            this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`)
                .each((i, element) => {
                    const partial = element.attribs.partial || 'main';
                    const contentKey = fragment.name + '_' + partial;
                    let replaceItem = {
                        type: REPLACE_ITEM_TYPE.CHUNKED_CONTENT,
                        partial: partial,
                        key: contentKey,
                    };
                    if (partial === 'main') {
                        fragmentAttributes = element.attribs;
                    }
                    replaceItems.push(replaceItem);
                    if (fragment.config && fragment.config.render.placeholder && replaceItem.partial === 'main') {
                        let placeholderContentKey = contentKey + '_placeholder';
                        replaceItems.push({
                            type: REPLACE_ITEM_TYPE.PLACEHOLDER,
                            partial: partial,
                            key: placeholderContentKey
                        });
                        this.dom(element).replaceWith(`<div puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" ${element.attribs.partial ? 'fragment-partial="' + element.attribs.partial + '"' : ''} puzzle-chunk="${contentKey}" puzzle-placeholder="${placeholderContentKey}"></div>`);
                    } else {
                        this.dom(element).replaceWith(`<div puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" ${element.attribs.partial ? 'fragment-partial="' + element.attribs.partial + '"' : ''} puzzle-chunk="${contentKey}"> </div>`);
                    }
                });

            chunkReplacements.push({
                fragment,
                replaceItems,
                fragmentAttributes
            });
        });

        return chunkReplacements;
    }

    /**
     * Creates containers for fragments should be waited
     * @param {FragmentStorefront[]} fragmentsShouldBeWaited
     * @returns {IReplaceSet[]}
     */
    private replaceWaitedFragmentContainers(fragmentsShouldBeWaited: FragmentStorefront[], replaceJsAssets: IReplaceAsset[]) {
        const waitedFragmentReplacements: IReplaceSet[] = [];

        fragmentsShouldBeWaited.forEach(fragment => {
            let replaceItems: IReplaceItem[] = [];
            let fragmentAttributes = {};

            const jsReplacements = replaceJsAssets.find(jsReplacement => jsReplacement.fragment.name === fragment.name);
            let contentStart = ``;
            let contentEnd = ``;

            jsReplacements && jsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_START).forEach(replaceItem => {
                contentStart += Template.wrapJsAsset(replaceItem);
            });

            jsReplacements && jsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_END).forEach(replaceItem => {
                contentEnd += Template.wrapJsAsset(replaceItem);
            });

            this.dom(contentStart).insertBefore(this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`).first());
            this.dom(contentEnd).insertAfter(this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`).last());

            this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`)
                .each((i, element) => {
                    let replaceKey = `{fragment|${element.attribs.name}_${element.attribs.from}_${element.attribs.partial || 'main'}}`;
                    const partial = element.attribs.partial || 'main';
                    replaceItems.push({
                        type: REPLACE_ITEM_TYPE.CONTENT,
                        key: replaceKey,
                        partial: partial,
                    });
                    if (partial === 'main') {
                        fragmentAttributes = element.attribs;
                    }
                    if (element.parentNode.name !== 'head') {
                        this.dom(element).replaceWith(`<div puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" ${element.attribs.partial ? 'fragment-partial="' + element.attribs.partial + '"' : ''}>${replaceKey}</div>`);
                    } else {
                        this.dom(element).replaceWith(replaceKey);
                    }
                });


            waitedFragmentReplacements.push({
                fragment,
                replaceItems,
                fragmentAttributes
            });
        });

        return waitedFragmentReplacements;
    }

    /**
     * Prepares JS asset replacements and replaces HEAD, BODY_START
     * @returns {Promise<IReplaceAsset[]>}
     */
    private prepareJsAssetLocations(): Promise<IReplaceAsset[]> {
        const replaceScripts: IReplaceAsset[] = [];

        return new Promise((resolve, reject) => {
            async.each(Object.keys(this.fragments), (fragmentName, cb) => {
                const fragment = this.fragments[fragmentName];
                if (fragment.config) {
                    const replaceItems: IReplaceAssetSet[] = [];
                    async.each(fragment.config.assets.filter(asset => asset.type === RESOURCE_TYPE.JS), async (asset: IFileResourceAsset, cba) => {
                        let assetContent = null;
                        if (asset.injectType === RESOURCE_INJECT_TYPE.INLINE) {
                            assetContent = await fragment.getAsset(asset.name);
                        }
                        switch (asset.location) {
                            case RESOURCE_LOCATION.HEAD:
                                this.dom('head').append(Template.wrapJsAsset({
                                    name: asset.name,
                                    injectType: asset.injectType,
                                    link: fragment.getAssetPath(asset.name),
                                    content: assetContent
                                }));
                                break;
                            case RESOURCE_LOCATION.BODY_START:
                                this.dom('body').prepend(Template.wrapJsAsset({
                                    name: asset.name,
                                    injectType: asset.injectType,
                                    link: fragment.getAssetPath(asset.name),
                                    content: assetContent
                                }));
                                break;
                            case RESOURCE_LOCATION.CONTENT_START:
                            case RESOURCE_LOCATION.CONTENT_END:
                            case RESOURCE_LOCATION.BODY_END:
                                replaceItems.push({
                                    content: assetContent,
                                    name: asset.name,
                                    link: fragment.getAssetPath(asset.name),
                                    injectType: asset.injectType,
                                    location: asset.location
                                });
                                break;
                        }
                        cba();
                    }, () => {
                        replaceScripts.push({
                            fragment,
                            replaceItems
                        });
                        cb();
                    });
                } else {
                    cb();
                }
            }, () => {
                return resolve(replaceScripts);
            });
        });
    }

    /**
     * Wraps js asset based on its configuration
     * @param {{injectType: RESOURCE_INJECT_TYPE; name: string; link: string | null | undefined; content: string | null | undefined}} asset
     * @returns {string}
     */
    static wrapJsAsset(asset: { injectType: RESOURCE_INJECT_TYPE; name: string; link: string | null | undefined; content: string | null | undefined }) {
        if (asset.injectType === RESOURCE_INJECT_TYPE.EXTERNAL && asset.link) {
            return `<script puzzle-dependency="${asset.name}" src="${asset.link}" type="text/javascript"/>`;
        } else if (asset.injectType === RESOURCE_INJECT_TYPE.INLINE && asset.content) {
            return `<script puzzle-dependency="${asset.name}" type="text/javascript">${asset.content}</script>`;
        } else {
            //todo handle error
            return `<!-- Failed to inject asset: ${asset.name} -->`;
        }
    }

    /**
     * Merges, minifies stylesheets and inject them into a page
     * @returns {Promise<any>}
     */
    private async buildStyleSheets() {
        const _CleanCss = new CleanCSS({
            level: {
                2: {
                    all: true
                }
            }
        } as any);

        let styleSheets: string[] = [];

        return new Promise((resolve, reject) => {
            async.each(Object.values(this.fragments), async (fragment, cb) => {
                if (!fragment.config) return cb();
                const cssAssets = fragment.config.assets.filter(asset => asset.type === RESOURCE_TYPE.CSS);

                for (let x = 0, len = cssAssets.length; x < len; x++) {
                    const assetContent = await fragment.getAsset(cssAssets[x].name);
                    if (assetContent) {
                        styleSheets.push(assetContent);
                    }
                }

                cb();
            }, err => {
                if (!err) {
                    let output = _CleanCss.minify(styleSheets.join(''));
                    if (output.styles.length > 0) {
                        this.dom('head').append(`<style>${output.styles}</style>`);
                    }
                }
                resolve();
            });
        });
    }
}
