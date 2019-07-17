import {nrSegment} from "./decorators";

export class TemplateClass {
    onCreate: Function | undefined;
    onRequest: Function | undefined;
    onChunk: Function | undefined;
    onResponseEnd: Function | undefined;

    _onCreate(...args: any[]) {
        this.onCreate && this.onCreate(...args);
    }

    @nrSegment("templateClass._onRequest", true)
    _onRequest(...args: any[]) {
        this.onRequest && this.onRequest(...args);
    }

    @nrSegment("templateClass._onChunk", true)
    _onChunk(...args: any[]) {
        this.onChunk && this.onChunk(...args);
    }

    @nrSegment("templateClass._onResponseEnd", true)
    _onResponseEnd(...args: any[]) {
        this.onResponseEnd && this.onResponseEnd(...args);
    }

    toDataAttribute(str: string) {
        return new Buffer(str).toString('base64');
    }

    [name: string]: any;
}
