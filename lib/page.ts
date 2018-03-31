import {FragmentMap} from "./fragment";
import EventEmitter = NodeJS.EventEmitter;
const htmlparser2 = require('htmlparser2');

export interface IPageConfiguration {
    html: string,
    url: string
}

export interface IHtmlParser2Node {
    name?: string;
    children?: Array<IHtmlParser2Node>;
    type?: string;
}

export class Template {
    public firstFlush: Function;
    public dom: Array<IHtmlParser2Node>;
    public fragment: FragmentMap = {};

    constructor(rawHtml: string){
        const parsed: Array<IHtmlParser2Node> = htmlparser2.parseDOM(rawHtml);
        const templateNode = parsed.find(node => node.name === 'template');
        if(templateNode && templateNode.children){
            this.dom = templateNode.children;
        }else{
            throw new Error('Failed to find template');
        }


    }
}

export class Page {
    public ready: boolean = false;
    private rawHtml: string;
    private eventBus: EventEmitter;
    private dom: any;

    constructor(rawHtml: string, eventBus: EventEmitter) {
        this.rawHtml = rawHtml;
        this.eventBus = eventBus;

        this.dom = Page.generateTemplateDom(this.rawHtml);
    }

    static generateTemplateDom(rawHtml: string){
        return
    }
}
