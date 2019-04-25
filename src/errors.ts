export enum ERROR_CODES {
    TEMPLATE_NOT_FOUND,
    MULTIPLE_PRIMARY_FRAGMENTS,
    CONFIGURATION_BASE_VALIDATION_ERROR,
    CALLABLE_ONCE_CALLED_MORE_THAN_ONE_TIME,
    FAILED_TO_COMPILE_TEMPLATE,
    FAILED_TO_GET_FRAGMENT_CONTENT
}

const ERROR_MESSAGES: { [name: string]: (...args: string[]) => string; } = Object.freeze({
    [ERROR_CODES.TEMPLATE_NOT_FOUND]: () => 'Template not found in html file',
    [ERROR_CODES.MULTIPLE_PRIMARY_FRAGMENTS]: () => 'Multiple primary fragments are not allowed',
    [ERROR_CODES.CONFIGURATION_BASE_VALIDATION_ERROR]: () => 'Use StorefrontConfiguration or GatewayConfiguration',
    [ERROR_CODES.CALLABLE_ONCE_CALLED_MORE_THAN_ONE_TIME]: (target: string, method: string) => `You can't call method ${method} of ${target} more than one once`,
    [ERROR_CODES.FAILED_TO_COMPILE_TEMPLATE]: (template: string) => `Failed to compile template: ${template}`,
    [ERROR_CODES.FAILED_TO_GET_FRAGMENT_CONTENT]: (fragmentName: string, url: string) => `Failed to get fragment contents for fragment ${fragmentName}, link: ${url}`
});

export class PuzzleError extends Error {
    constructor(ERROR_CODE: ERROR_CODES, ...args: string[]) {
        super(ERROR_MESSAGES[ERROR_CODE].apply(null, args));
        Object.setPrototypeOf(this, PuzzleError.prototype);
    }
}

