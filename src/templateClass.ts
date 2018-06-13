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

    toDataAttribute(str: string){
        return new Buffer(str).toString('base64');
    }

    [name: string]: any;
}
