export enum ERROR_CODES {
    TEMPLATE_NOT_FOUND,
    MULTIPLE_PRIMARY_FRAGMENTS
}

const ERROR_MESSAGES: { [name: string]: () => string; } = Object.freeze({
    [ERROR_CODES.TEMPLATE_NOT_FOUND]: () => 'Template not found in html file',
    [ERROR_CODES.MULTIPLE_PRIMARY_FRAGMENTS]: () => 'Multiple primary fragments are not allowed'
});

export class PuzzleError extends Error {
    constructor(ERROR_CODE: ERROR_CODES, ...args: string[]) {
        super(ERROR_MESSAGES[ERROR_CODE].apply(null, args));
        Object.setPrototypeOf(this, PuzzleError.prototype);
    }
}

