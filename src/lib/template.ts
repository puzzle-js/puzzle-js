import {FragmentStorefront} from "./fragment";
import cheerio from "cheerio";
import {TemplateCompiler} from "./templateCompiler";
import {HTML_FRAGMENT_NAME_ATTRIBUTE, HTML_GATEWAY_ATTRIBUTE} from "./enums";
import {IPageDependentGateways} from "../types/page";

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

            return dependencyList;
        }, {
            gateways: {},
            fragments: {}
        });
    }

    public async compile(testCookies: { [cookieName: string]: string }) {
        const fragments = this.dom('fragment');
        //this.fragments kullan !!!!!
        let firstFlush = null;

        if (fragments.length === 0) {
            firstFlush = TemplateCompiler.compile(this.dom.html()).bind(this.pageClass);
        } else {
            //bu anda gateway configi cekilmis olmali
            fragments.each((i, fragmentNode) => {
                //this.fragments[fragmentNode.attribs.name] = new Fragment()
                const $ = cheerio.load(`<div id="${fragmentNode.attribs.name}" ${HTML_GATEWAY_ATTRIBUTE}="${fragmentNode.attribs.from}" ${HTML_FRAGMENT_NAME_ATTRIBUTE}="${fragmentNode.attribs.name}"></div>`);
                const fragmentItem = $('#' + fragmentNode.attribs.name);
                fragmentItem.append('<script></script>'); // varsa start script
                fragmentItem.append('<div></div>'); // Asil contentler, varsa icinde placeholder olmali
                fragmentItem.append('<script></script>'); // varsa content end script, sarilmis olmali
                this.dom(fragmentNode).replaceWith($.html());
            });
            firstFlush = TemplateCompiler.compile(this.dom.html()).bind(this.pageClass);
        }

        return (req: object, res: object) => {
            //async waterfall,
            //firstflush
            //async.parallel
        }
    }
}
