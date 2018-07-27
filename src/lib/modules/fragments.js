"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var module_1 = require("../module");
var util_1 = require("../util");
var enums_1 = require("../enums");
var Fragments = /** @class */ (function (_super) {
    __extends(Fragments, _super);
    function Fragments() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Fragments.prototype.set = function (fragmentInfo) {
        util_1.Util.wrapGroup('PuzzleJs', 'Debug Mode - Fragments', function () {
            Object.keys(fragmentInfo).forEach(function (fragmentName) {
                util_1.Util.wrapGroup('PuzzleJs', fragmentName, function () {
                    util_1.Util.log(fragmentInfo[fragmentName]);
                }, enums_1.LOG_COLORS.BLUE);
            });
        });
    };
    return Fragments;
}(module_1.Module));
exports.Fragments = Fragments;
//# sourceMappingURL=fragments.js.map