import {FragmentStorefront} from "./fragment";
import cheerio from "cheerio";
import {TemplateCompiler} from "./templateCompiler";
import {CONTENT_NOT_FOUND_ERROR, HTML_FRAGMENT_NAME_ATTRIBUTE} from "./config";
import {IPageDependentGateways} from "../types/page";
import async, {reject} from "async";
import {HTML_GATEWAY_ATTRIBUTE} from "./config";
import {IReplaceItem, IReplaceSet} from "../types/template";
import {CONTENT_REPLACE_SCRIPT, REPLACE_ITEM_TYPE} from "./enums";
import {IFragmentStorefrontAttributes} from "../types/fragment";

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
        const pageClassScriptRegex = /<script>(.*?)<\/script>(.*)<template>/mis;
        const templateRegex = /<template>(.*?)<\/template>/mis;

        const templateMatch = templateRegex.exec(rawHtml);
        if (templateMatch) {
            this.dom = cheerio.load(templateMatch[1], {
                normalizeWhitespace: true,
                recognizeSelfClosing: true,
                xmlMode: true,
                lowerCaseAttributeNames: true,
            });
        } else {
            throw new Error('Template not found in html file');
        }

        const scriptMatch = pageClassScriptRegex.exec(rawHtml);
        if (scriptMatch) {
            const pageClass = eval(scriptMatch[1]);
            pageClass.__proto__ = new TemplateClass();
            this.pageClass = pageClass;
        }

        this.pageClass._onCreate();
    }

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
    async compile(testCookies: { [cookieName: string]: string }) {
        let firstFlushHandler: Function;
        const waitedFragmentReplacements: IReplaceSet[] = [];

        const fragmentsShouldBeWaited = Object.values(this.fragments).filter(fragment => fragment.config && fragment.shouldWait);
        const chunkedFragments = Object.values(this.fragments).filter(fragment => fragment.config && !fragment.shouldWait);
        const chunkedReplacements: IReplaceSet[] = [];
        const staticFragments = Object.values(this.fragments).filter(fragment => fragment.config && fragment.config.render.static);


        if (Object.keys(this.fragments).length === 0) {
            firstFlushHandler = TemplateCompiler.compile(this.clearHtmlContent(this.dom.html()));
            return this.buildHandler(firstFlushHandler, chunkedReplacements);
        }

        //todo statik fragmentlar burada cekilip eklenmeli


        fragmentsShouldBeWaited.forEach(fragment => {
            let replaceItems: IReplaceItem[] = [];
            let fragmentAttributes = {};
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

            //todo asset lokasyonlari burada belirlenmeli

            waitedFragmentReplacements.push({
                fragment,
                replaceItems,
                fragmentAttributes
            });
        });


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

            chunkedReplacements.push({
                fragment,
                replaceItems,
                fragmentAttributes
            });
        });

        this.replaceUnfetchedFragments(Object.values(this.fragments).filter(fragment => !fragment.config));
        await this.replaceStaticFragments(staticFragments);
        await this.appendPlaceholders(chunkedReplacements);

        return this.buildHandler(TemplateCompiler.compile(this.clearHtmlContent(this.dom.html())), chunkedReplacements, waitedFragmentReplacements);
    }

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
                        output = output.replace(replaceItem.key, fragmentContent.html[replaceItem.partial] || CONTENT_NOT_FOUND_ERROR);
                    }
                });
            cb();
        }, err => {
            //if (err) //todo handle error
            cb({output, status: statusCode});
        });
    }

    private buildHandler(firstFlushHandler: Function, chunkedFragmentReplacements: IReplaceSet[], waitedFragments: IReplaceSet[] = []) {
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
                        const fragmentContent = await chunkedReplacement.fragment.getContent(chunkedReplacement.fragmentAttributes);

                        chunkedReplacement.replaceItems
                            .forEach(replaceItem => {
                                if (replaceItem.type === REPLACE_ITEM_TYPE.CHUNKED_CONTENT) {
                                    this.flushChunk(chunkedReplacement.fragment, fragmentContent.html[replaceItem.partial] || CONTENT_NOT_FOUND_ERROR, replaceItem, res.write);
                                    this.pageClass._onChunk();
                                }
                            });
                        cb();
                    }, (err) => {
                        res.end('</body></html>');
                        this.pageClass._onResponseEnd();
                    });
                });
            };
        }
    }

    private clearHtmlContent(str: string) {
        return str.replace(/>\s+</g, "><").trim();
    }

    private flushChunk(fragment: FragmentStorefront, content: string, replaceItem: IReplaceItem, resWrite: Function) {
        if (!fragment.config) return; //todo handle error
        let output = `<div style="display: none;" puzzle-fragment="${fragment.name}" puzzle-chunk-key="${replaceItem.key}">${content}</div>`;

        if (!(replaceItem.key === 'main' && fragment.config.render.selfReplace)) {
            output += `<script>$p('[puzzle-chunk="${replaceItem.key}"]','[puzzle-chunk-key="${replaceItem.key}"]');</script>`;
        }

        //todo buraya adamin content end scriptlerini koyabiliriz.


        resWrite(output);
    }

    private replaceUnfetchedFragments(fragments: FragmentStorefront[]) {
        fragments.forEach(fragment => {
            this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`).replaceWith(`<div puzzle-fragment="${fragment.name}" puzzle-gateway="${fragment.from}">${CONTENT_NOT_FOUND_ERROR}</div>`);
        });
    }

    private replaceStaticFragments(fragments: FragmentStorefront[]) {
        fragments.forEach(fragment => {
            console.log(fragment);
        });
    }
}
