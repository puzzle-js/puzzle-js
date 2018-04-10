export const HTML_GATEWAY_ATTRIBUTE = 'puzzle-gateway';
export const HTML_FRAGMENT_NAME_ATTRIBUTE = 'puzzle-fragment';

export enum EVENTS {
    GATEWAY_UPDATED = 'GATEWAY_UPDATED',
    GATEWAY_READY = 'GATEWAY_READY'
}

export enum FRAGMENT_RENDER_MODES {
    PREVIEW,
    STREAM
}

export enum RESOURCE_INJECT_TYPE {
    INLINE,
    EXTERNAL
}

export enum RESOURCE_LOCATION {
    HEAD,
    BODY_START,
    BODY_END,
    CONTENT_START,
    CONTENT_END
}