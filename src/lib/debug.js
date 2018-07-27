"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var puzzle_1 = require("./puzzle");
var core_1 = require("./core");
var info_1 = require("./modules/info");
var variables_1 = require("./modules/variables");
var fragments_1 = require("./modules/fragments");
var analytics_1 = require("./modules/analytics");
var storage_1 = require("./modules/storage");
(function () {
    var MODULES = {
        Core: core_1.Core,
        Info: info_1.Info,
        Variables: variables_1.Variables,
        Fragments: fragments_1.Fragments,
        Analytics: analytics_1.Analytics,
        Storage: storage_1.Storage
    };
    puzzle_1.PuzzleJs.inject(MODULES);
    window.PuzzleJs = puzzle_1.PuzzleJs;
})();
//# sourceMappingURL=debug.js.map