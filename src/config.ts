const loadConfigurationFromEnv = (name: string, isObject: boolean = false) => {
    const environmentVariable = process.env[name];
    if (isObject) {
        return environmentVariable ? JSON.parse(environmentVariable) : undefined;
    } else {
        return environmentVariable;
    }
};


export const DEFAULT_POLLING_INTERVAL = +loadConfigurationFromEnv('DEFAULT_POLLING_INTERVAL') || 1250;
export const CONTENT_NOT_FOUND_ERROR = loadConfigurationFromEnv('CONTENT_NOT_FOUND_ERROR') || `<script>console.log('Fragment Part does not exists')</script>`;
export const DEFAULT_CONTENT_TIMEOUT = +loadConfigurationFromEnv('DEFAULT_CONTENT_TIMEOUT') || 15000;
export const RENDER_MODE_QUERY_NAME = loadConfigurationFromEnv('RENDER_MODE_QUERY_NAME') || '__renderMode';
export const PREVIEW_PARTIAL_QUERY_NAME = loadConfigurationFromEnv('PREVIEW_PARTIAL_QUERY_NAME') || '__partial';
export const API_ROUTE_PREFIX = loadConfigurationFromEnv('API_ROUTE_PREFIX') || 'api';
export const GATEWAY_PREPERATION_CHECK_INTERVAL = +loadConfigurationFromEnv('GATEWAY_PREPERATION_CHECK_INTERVAL') || 200;
export const CHEERIO_CONFIGURATION = loadConfigurationFromEnv('CHEERIO_CONFIGURATION', true) || {
    normalizeWhitespace: true,
    recognizeSelfClosing: true,
    xmlMode: true,
    lowerCaseAttributeNames: true,
    decodeEntities: false
};
export const TEMPLATE_FRAGMENT_TAG_NAME = loadConfigurationFromEnv('TEMPLATE_FRAGMENT_TAG_NAME') || 'fragment';
export const DEFAULT_GZIP_EXTENSIONS = loadConfigurationFromEnv('DEFAULT_GZIP_EXTENSIONS', true) || ['.js', '.css'];
export const DEBUG_QUERY_NAME = loadConfigurationFromEnv('DEBUG_QUERY_NAME') || '__debug';
export const PUZZLE_DEBUGGER_LINK = loadConfigurationFromEnv('PUZZLE_DEBUGGER_LINK') || '/static/puzzle_debug.js';
export const DEBUG_INFORMATION = loadConfigurationFromEnv('DEBUG_INFORMATION') || process.env.NODE_ENV !== 'production' || false;
export const NO_COMPRESS_QUERY_NAME = loadConfigurationFromEnv('NO_COMPRESS_QUERY_NAME') || '__noCompress';
export const NON_SELF_CLOSING_TAGS = ['div','span', 'p'];
