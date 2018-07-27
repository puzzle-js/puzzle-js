"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PuzzleJs = /** @class */ (function () {
    function PuzzleJs() {
    }
    PuzzleJs.subscribe = function (event, cb) {
        if (!PuzzleJs.__LISTENERS[event]) {
            PuzzleJs.__LISTENERS[event] = [cb];
        }
        else {
            PuzzleJs.__LISTENERS[event].push(cb);
        }
    };
    PuzzleJs.emit = function (event) {
        var data = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            data[_i - 1] = arguments[_i];
        }
        if (PuzzleJs.__LISTENERS[event]) {
            for (var _a = 0, _b = PuzzleJs.__LISTENERS[event]; _a < _b.length; _a++) {
                var listener = _b[_a];
                listener.apply(null, data);
            }
        }
    };
    PuzzleJs.clearListeners = function () {
        PuzzleJs.__LISTENERS = {};
    };
    PuzzleJs.inject = function (modules) {
        for (var name_1 in modules) {
            PuzzleJs[name_1] = modules[name_1];
        }
    };
    PuzzleJs.PACKAGE_VERSION = '';
    PuzzleJs.DEPENDENCIES = {};
    PuzzleJs.LOGO = '';
    PuzzleJs.__LISTENERS = {};
    return PuzzleJs;
}());
exports.PuzzleJs = PuzzleJs;
//# sourceMappingURL=puzzle.js.map