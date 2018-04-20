import {FragmentStorefront} from "./fragment";
import cheerio from "cheerio";
import {TemplateCompiler} from "./templateCompiler";
import {HTML_FRAGMENT_NAME_ATTRIBUTE} from "./config";
import {IPageDependentGateways} from "../types/page";
import async from "async";
import {HTML_GATEWAY_ATTRIBUTE} from "./config";
import {IReplaceItem} from "../types/template";
import {REPLACE_ITEM_TYPE} from "./enums";

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
                this.fragments[fragment.attribs.name] = new FragmentStorefront(fragment.attribs);
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
        const chunkHandlers: Function[] = [];
        const waitedHandlers: Function[] = [];
        const fragmentsShouldBeWaited = Object.values(this.fragments).filter(fragment => fragment.shouldWait);
        const chunkedFragments = Object.values(this.fragments).filter(fragment => !fragment.shouldWait);

        // 0 fragments
        if (Object.keys(this.fragments).length === 0) {
            firstFlushHandler = TemplateCompiler.compile(this.clearHtmlContent(this.dom.html()));
            return this.buildHandler(firstFlushHandler, chunkHandlers);
        }

        fragmentsShouldBeWaited.forEach(fragment => {
            let replaceItems: IReplaceItem[] = [];
            this.dom(`fragment[from="${fragment.attribs.from}"][name="${fragment.attribs.name}"]${fragment.attribs.partial ? '[partial="' + fragment.attribs.from + '"]' : ''}`)
                .each((i, element) => {
                    let replaceKey = `{fragment|${element.attribs.name}_${element.attribs.from}_${element.attribs.partial || 'main'}}`;
                    replaceItems.push({
                        type: REPLACE_ITEM_TYPE.CONTENT,
                        key: replaceKey,
                        partial: element.attribs.partial || 'main',
                    });
                    this.dom(element).replaceWith(`<div puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" ${element.attribs.partial ? 'fragment-partial="' + element.attribs.partial + '"' : ''}>${replaceKey}</div>`);
                });

            //asset lokasyonlari burada belirlenmeli

            waitedHandlers.push(this.waitedFragmentHandler(fragment, replaceItems));
        });


        return this.buildHandler(TemplateCompiler.compile(this.clearHtmlContent(this.dom.html())), chunkHandlers, waitedHandlers);
    }

    private waitedFragmentHandler(fragment: FragmentStorefront, replaceItems: IReplaceItem[]) {
        return async (req: object, template: string) => {
            //todo async handle here always return changing the template
            const fragmentContent = await fragment.getContent();
            console.log(fragment.name,replaceItems);
            replaceItems.filter(item => item.type === REPLACE_ITEM_TYPE.CONTENT).forEach(replaceItem => {
                template = template.replace(replaceItem.key, fragmentContent[replaceItem.partial] || 'No content');
            });

            return template;
        };
    }

    private buildHandler(firstFlushHandler: Function, chunkHandlers: Function[], waitedFragments: Function[] = []) {
        if (chunkHandlers.length === 0) {
            return (req: any, res: any) => {
                if (waitedFragments.length > 0) {
                    let output = firstFlushHandler.call(this.pageClass, req);
                    async.forEach(waitedFragments, (handler, cb) => {
                        handler(req, output).then((replacedContent: string) => {
                            output = replacedContent;
                            //todo output fixle...
                            cb();
                        });
                    }, err => {
                        console.log(err);
                        res.end(output, req);
                    });
                } else {
                    res.end(firstFlushHandler.call(this.pageClass, req));
                }

                this.pageClass._onResponseEnd();
            };
        } else {
            return (req: any, res: any) => {
                this.pageClass._onRequest(req);
                res.write(firstFlushHandler.call(this.pageClass, req));
                async.parallel(chunkHandlers.map(fn => {
                    return (async () => {
                        res.write(await fn());
                        this.pageClass._onChunk();
                    });
                }), err => {
                    res.end();
                    this.pageClass._onResponseEnd();
                });
            };
        }
    }

    private clearHtmlContent(str: string) {
        return str.replace(/>\s+</g, "><").trim();
    }
}
