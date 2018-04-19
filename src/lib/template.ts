import {FragmentStorefront} from "./fragment";
import cheerio from "cheerio";
import {TemplateCompiler} from "./templateCompiler";
import {HTML_FRAGMENT_NAME_ATTRIBUTE} from "./config";
import {IPageDependentGateways} from "../types/page";
import async from "async";
import {HTML_GATEWAY_ATTRIBUTE} from "./config";

export class TemplateClass {
    public onCreate: Function | undefined;
    public onRequest: Function | undefined;
    public onChunk: Function | undefined;
    public onResponseEnd: Function | undefined;

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
    public dom: CheerioStatic;
    public fragments: { [name: string]: FragmentStorefront } = {};
    public pageClass: TemplateClass = new TemplateClass();

    constructor(rawHtml: string) {
        const pageClassScriptRegex = /<script>(.*?)<\/script>(.*)<template>/mis;
        const templateRegex = /<template>(.*?)<\/template>/mis;

        const templateMatch = templateRegex.exec(rawHtml);
        if (templateMatch) {
            this.dom = cheerio.load(templateMatch[1], {
                normalizeWhitespace: true,
                recognizeSelfClosing: true,
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

    public getDependencies() {
        let primaryName: string | null = null;

        return this.dom('fragment').toArray().reduce((dependencyList: IPageDependentGateways, fragment: any) => {
            if (!dependencyList.gateways[fragment.attribs.from]) {
                dependencyList.gateways[fragment.attribs.from] = {
                    gateway: null,
                    ready: false
                }
            }

            if (!dependencyList.fragments[fragment.attribs.name]) {
                this.fragments[fragment.attribs.name] = new FragmentStorefront(fragment.attribs.name);
                dependencyList.fragments[fragment.attribs.name] = {
                    gateway: fragment.attribs.from,
                    instance: this.fragments[fragment.attribs.name]
                }
            }

            if (this.fragments[fragment.attribs.name].primary == false) {
                if (typeof fragment.attribs.primary != 'undefined') {
                    if(primaryName != null && primaryName != fragment.attribs.name) throw new Error('Multiple primary fragments are not allowed');
                    primaryName = fragment.attribs.name;
                    this.fragments[fragment.attribs.name].primary = true;
                    this.fragments[fragment.attribs.name].shouldWait = true;
                }
            }

            if (this.fragments[fragment.attribs.name].shouldWait == false) {
                this.fragments[fragment.attribs.name].shouldWait = typeof fragment.attribs.shouldwait != 'undefined' || (fragment.parent && fragment.parent.prev && fragment.parent.prev.name == 'head') || false;
            }


            return dependencyList;
        }, {
            gateways: {},
            fragments: {}
        });
    }

    public async compile(testCookies: { [cookieName: string]: string }) {
        const fragments = this.dom('fragment');
        let firstFlushHandler: Function;
        let chunkHandlers: Array<Function> = [];

        if (fragments.length === 0) {
            firstFlushHandler = TemplateCompiler.compile(this.dom('body').html() as string).bind(this.pageClass);
        } else {
            //bu anda gateway configi cekilmis olmali
            fragments.each((i, fragmentNode) => {
                //this.fragments[fragmentNode.attribs.name] = new Fragment()
                const $ = cheerio.load(`<div id="${fragmentNode.attribs.name}" ${HTML_GATEWAY_ATTRIBUTE}="${fragmentNode.attribs.from}" ${HTML_FRAGMENT_NAME_ATTRIBUTE}="${fragmentNode.attribs.name}"></div>`);
                const fragmentItem = $('#' + fragmentNode.attribs.name);
                // fragmentItem.append('<script></script>'); // varsa start script
                // fragmentItem.append('<div></div>'); // Asil contentler, varsa icinde placeholder olmali
                // fragmentItem.append('<script></script>'); // varsa content end script, sarilmis olmali
                this.dom(fragmentNode).replaceWith($.html());
            });
            firstFlushHandler = () => '';
        }

        return this.buildHandler(firstFlushHandler, chunkHandlers);
    }


    private buildHandler(firstFlushHandler: Function, chunkHandlers: Array<Function>) {
        if (chunkHandlers.length == 0) {
            return (req: any, res: any) => {
                res.end(firstFlushHandler.call(this.pageClass, req));
                this.pageClass._onResponseEnd();
            }
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
                })
            }
        }
    }
}
