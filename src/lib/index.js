"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var puzzle_1 = require("./puzzle");
var core_1 = require("./core");
(function () {
    var MODULES = {
        Core: core_1.Core
    };
    puzzle_1.PuzzleJs.inject(MODULES);
    window.PuzzleJs = puzzle_1.PuzzleJs;
})();
//# sourceMappingURL=index.js.map