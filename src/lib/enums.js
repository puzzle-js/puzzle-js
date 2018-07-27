"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LOG_COLORS;
(function (LOG_COLORS) {
    LOG_COLORS["GREY"] = "#7f8c8d";
    LOG_COLORS["GREEN"] = "#2ecc71";
    LOG_COLORS["YELLOW"] = "#f39c12";
    LOG_COLORS["RED"] = "#c0392b";
    LOG_COLORS["BLUE"] = "#3498db";
})(LOG_COLORS = exports.LOG_COLORS || (exports.LOG_COLORS = {}));
var LOG_TYPES;
(function (LOG_TYPES) {
    LOG_TYPES["INFO"] = "info";
    LOG_TYPES["ERROR"] = "error";
    LOG_TYPES["WARN"] = "warn";
    LOG_TYPES["LOG"] = "log";
})(LOG_TYPES = exports.LOG_TYPES || (exports.LOG_TYPES = {}));
var EVENT;
(function (EVENT) {
    EVENT[EVENT["ON_PAGE_LOAD"] = 0] = "ON_PAGE_LOAD";
    EVENT[EVENT["ON_FRAGMENT_RENDERED"] = 1] = "ON_FRAGMENT_RENDERED";
    EVENT[EVENT["ON_CONFIG"] = 2] = "ON_CONFIG";
    EVENT[EVENT["ON_DEBUG_CONFIG"] = 3] = "ON_DEBUG_CONFIG";
    EVENT[EVENT["ON_VARIABLES"] = 4] = "ON_VARIABLES";
    EVENT[EVENT["ON_RENDER_START"] = 5] = "ON_RENDER_START";
})(EVENT = exports.EVENT || (exports.EVENT = {}));
var TIME_LABELS;
(function (TIME_LABELS) {
    TIME_LABELS["HTML_TRANSFER_STARTED"] = "html-transfer-start";
    TIME_LABELS["HTML_TRANSFER_ENDED"] = "html-transfer-end";
    TIME_LABELS["FRAGMENT_RENDER_START"] = "fragment-render-started-";
    TIME_LABELS["FRAGMENT_RENDER_END"] = "fragment-render-ended-";
    TIME_LABELS["FRAGMENT_MEASUREMENT"] = "fragment-total-";
    TIME_LABELS["FRAGMENT_MEASUREMENT_RESPONSE_START_TIME"] = "fragment-response-start-";
})(TIME_LABELS = exports.TIME_LABELS || (exports.TIME_LABELS = {}));
var RESOURCE_LOADING_TYPE;
(function (RESOURCE_LOADING_TYPE) {
    /**
     * @description Loads resource in head. Visible in page source. Great for small dependencies.
     */
    RESOURCE_LOADING_TYPE[RESOURCE_LOADING_TYPE["ON_RENDER_START"] = 0] = "ON_RENDER_START";
    /**
     * @description Starts loading resource after fragment rendered. Not visible in page source. It is useful for fragments that should run immediately
     */
    RESOURCE_LOADING_TYPE[RESOURCE_LOADING_TYPE["ON_FRAGMENT_RENDER"] = 1] = "ON_FRAGMENT_RENDER";
    /**
     * @description Starts loading resource after all page fragments are visible. Great for performance
     */
    RESOURCE_LOADING_TYPE[RESOURCE_LOADING_TYPE["ON_PAGE_RENDER"] = 2] = "ON_PAGE_RENDER";
    /**
     * @description Starts loading resource after all assets are loaded and injected. Great for marketing scripts and 3rd party tracking tools
     */
    //ON_ALL_ASSETS_LOADED
})(RESOURCE_LOADING_TYPE = exports.RESOURCE_LOADING_TYPE || (exports.RESOURCE_LOADING_TYPE = {}));
var RESOURCE_TYPE;
(function (RESOURCE_TYPE) {
    RESOURCE_TYPE[RESOURCE_TYPE["CSS"] = 0] = "CSS";
    RESOURCE_TYPE[RESOURCE_TYPE["JS"] = 1] = "JS";
})(RESOURCE_TYPE = exports.RESOURCE_TYPE || (exports.RESOURCE_TYPE = {}));
//# sourceMappingURL=enums.js.map