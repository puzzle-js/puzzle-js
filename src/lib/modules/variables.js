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
var enums_1 = require("../enums");
var decorators_1 = require("../decorators");
var Variables = /** @class */ (function (_super) {
    __extends(Variables, _super);
    function Variables() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Variables, "variables", {
        get: function () {
            return Variables.__variables;
        },
        set: function (value) {
            Variables.__variables = value;
        },
        enumerable: true,
        configurable: true
    });
    Variables.print = function () {
        util_1.Util.wrapGroup('PuzzleJs', 'Debug Mode - Variables', function () {
            Object.keys(Variables.variables).forEach(function (fragmentName) {
                util_1.Util.wrapGroup('PuzzleJs', fragmentName, function () {
                    Object.keys(Variables.variables[fragmentName]).forEach(function (configKey) {
                        util_1.Util.wrapGroup('PuzzleJs', configKey, function () {
                            util_1.Util.log(Variables.variables[fragmentName][configKey]);
                        }, enums_1.LOG_COLORS.YELLOW);
                    });
                }, enums_1.LOG_COLORS.BLUE);
            });
        });
    };
    Variables.set = function (fragmentName, varName, configData) {
        if (!Variables.variables[fragmentName]) {
            Variables.variables[fragmentName] = {};
        }
        Variables.variables[fragmentName][varName] = configData;
    };
    Variables.__variables = {};
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_PAGE_LOAD)
    ], Variables, "print", null);
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_VARIABLES)
    ], Variables, "set", null);
    return Variables;
}(module_1.Module));
exports.Variables = Variables;
//# sourceMappingURL=variables.js.map