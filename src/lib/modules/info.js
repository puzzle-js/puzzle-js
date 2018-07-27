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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var module_1 = require("../module");
var util_1 = require("../util");
var puzzle_1 = require("../puzzle");
var decorators_1 = require("../decorators");
var enums_1 = require("../enums");
var Info = /** @class */ (function (_super) {
    __extends(Info, _super);
    function Info() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Info.showInformation = function () {
        var _this = this;
        util_1.Util.wrapGroup('PuzzleJs', 'Debug Mode - Package Info', function () {
            _this.logo();
            util_1.Util.log("PuzzleJs: " + puzzle_1.PuzzleJs.PACKAGE_VERSION);
            util_1.Util.table(puzzle_1.PuzzleJs.DEPENDENCIES);
        });
    };
    Info.logo = function () {
        window.console.log('%c       ', "font-size: 400px; background: url(" + puzzle_1.PuzzleJs.LOGO + ") no-repeat;");
    };
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_PAGE_LOAD)
    ], Info, "showInformation", null);
    return Info;
}(module_1.Module));
exports.Info = Info;
//# sourceMappingURL=info.js.map