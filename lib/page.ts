import {Parser} from "htmlparser2"

export interface PageConfiguration {
    html: string,
    url: string
}

export class Page {
    private rawHtml: string;

    constructor(html: string) {
        this.rawHtml = html;
    }
}
