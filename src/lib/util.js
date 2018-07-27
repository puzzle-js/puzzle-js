"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var enums_1 = require("./enums");
var Util = /** @class */ (function () {
    function Util() {
    }
    Util.wrapGroup = function (name, description, fn, color) {
        if (color === void 0) { color = enums_1.LOG_COLORS.GREEN; }
        var logConfig = function (name, color) { return ['%c' + name, "background: " + color + "; color: white; padding: 2px 0.5em; " + "border-radius: 0.5em;"]; };
        (_a = window.console).groupCollapsed.apply(_a, logConfig(name, color).concat([description]));
        fn();
        window.console.groupEnd();
        var _a;
    };
    Util.log = function (content, type, color) {
        if (type === void 0) { type = enums_1.LOG_TYPES.INFO; }
        if (color === void 0) { color = enums_1.LOG_COLORS.BLUE; }
        var logConfig = function (color) { return ['%cPuzzleJs', "background: " + color + "; color: white; padding: 2px 0.5em; " + "border-radius: 0.5em;"]; };
        (_a = window.console)[type].apply(_a, logConfig(color).concat([content]));
        var _a;
    };
    Util.table = function (content) {
        window.console.table(content);
    };
    return Util;
}());
exports.Util = Util;
//# sourceMappingURL=util.js.map