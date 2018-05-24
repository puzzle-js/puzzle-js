export enum ERROR_CODES {
    TEMPLATE_NOT_FOUND
}

const ERROR_MESSAGES: { [name: string]: () => string; } = Object.freeze({
    [ERROR_CODES.TEMPLATE_NOT_FOUND]: () => 'Template not found in html file'
});

export class PuzzleError extends Error {
    constructor(ERROR_CODE: ERROR_CODES, ...args: string[]) {
        super(ERROR_MESSAGES[ERROR_CODE].apply(null, args));
        Object.setPrototypeOf(this, PuzzleError.prototype);
    }
}

