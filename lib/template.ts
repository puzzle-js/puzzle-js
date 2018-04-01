import {IFragmentMap} from "./fragment";
import cheerio from "cheerio";
import {TemplateCompiler} from "./templateCompiler";
import {HTML_FRAGMENT_NAME_ATTRIBUTE, HTML_GATEWAY_ATTRIBUTE} from "./enums";

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
}

export class Template {
    private firstFlush: Function = () => '';
    private dom: CheerioStatic;
    private fragments: IFragmentMap = {};
    private pageClass: TemplateClass = new TemplateClass();

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
        this.generateFirstFlush();
    }

    private generateFirstFlush() {
        const fragments = this.dom('fragment');
        if (fragments.length === 0) {
            this.firstFlush = TemplateCompiler.compile(this.dom.html()).bind(this.pageClass);
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
            this.firstFlush = TemplateCompiler.compile(this.dom.html()).bind(this.pageClass);
            //console.log(this.firstFlush());
        }
    }

    static generateFunctionString(functionContent: string, name?: string) {
        if (name) {
            return '<script>function ' + name + '(){' +
                '/*<!--*/\n' +
                functionContent +
                '\n/*-->*/};</script>';
        } else {
            return '<script>/*<!--*/\n' +
                functionContent +
                '\n/*-->*/;</script>';
        }
    };
}
