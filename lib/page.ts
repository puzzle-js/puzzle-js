import EventEmitter = NodeJS.EventEmitter;
import {Template} from "./template";

export interface IPageConfiguration {
    html: string,
    url: string
}

export class Page {
    public ready: boolean = false;
    private template: Template;
    private eventBus: EventEmitter;

    constructor(rawHtml: string, eventBus: EventEmitter) {
        this.eventBus = eventBus;

        this.template = new Template(rawHtml);
    }
}
