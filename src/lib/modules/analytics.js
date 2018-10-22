"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
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
var Analytics = /** @class */ (function (_super) {
    __extends(Analytics, _super);
    function Analytics() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Analytics, "fragments", {
        get: function () {
            return this._fragments;
        },
        set: function (value) {
            this._fragments = value;
        },
        enumerable: true,
        configurable: true
    });
    Analytics.start = function (config) {
        Analytics.connectionInformation = Analytics.collectConnectionInformation();
        performance.mark("" + enums_1.TIME_LABELS.HTML_TRANSFER_STARTED);
        Analytics.fragments = Analytics.fragments.concat(JSON.parse(config).fragments);
    };
    Analytics.end = function () {
        var _this = this;
        util_1.Util.wrapGroup('PuzzleJs', 'Debug Mode - Analytics', function () {
            util_1.Util.table({
                'Round Trip Time': _this.connectionInformation.rtt + " ms",
                'Connection Speed': _this.connectionInformation.downlink + " kbps",
                'Connection Type': _this.connectionInformation.effectiveType
            });
            var fragmentsTableData = Analytics.fragments.reduce(function (fragmentMap, fragment) {
                fragmentMap[fragment.name] = {
                    'Parsing Started': ~~fragment.loadTime[0].startTime + " ms",
                    'Parse Duration': ~~fragment.loadTime[0].duration + " ms",
                };
                return fragmentMap;
            }, {});
            util_1.Util.table(fragmentsTableData);
            if (window.performance && performance.getEntriesByType) {
                var performance_1 = window.performance;
                var performanceEntries = performance_1.getEntriesByType('paint');
                performanceEntries.forEach(function (performanceEntry, i, entries) {
                    util_1.Util.log("The time to " + performanceEntry.name + " was " + performanceEntry.startTime + " milliseconds.");
                });
            }
        });
    };
    Analytics.fragment = function (name) {
        var fragment = Analytics.fragments.find(function (fragment) { return fragment.name === name; });
        performance.mark("" + enums_1.TIME_LABELS.FRAGMENT_RENDER_END + name);
        performance.measure("" + enums_1.TIME_LABELS.FRAGMENT_MEASUREMENT + name, "" + enums_1.TIME_LABELS.HTML_TRANSFER_STARTED, "" + enums_1.TIME_LABELS.FRAGMENT_RENDER_END + name);
        fragment.loadTime = performance.getEntriesByName("" + enums_1.TIME_LABELS.FRAGMENT_MEASUREMENT + name);
    };
    Analytics.collectConnectionInformation = function () {
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        //if (!connection) log('Connection api is not supported', LOG_TYPES.WARN, LOG_COLORS.RED);
        return {
            rtt: connection ? connection.rtt : '',
            effectiveType: connection ? connection.effectiveType : '',
            downlink: connection ? connection.downlink : ''
        };
    };
    Analytics._fragments = [];
    Analytics.connectionInformation = null;
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_CONFIG)
    ], Analytics, "start", null);
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_PAGE_LOAD)
    ], Analytics, "end", null);
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_FRAGMENT_RENDERED)
    ], Analytics, "fragment", null);
    return Analytics;
}(module_1.Module));
exports.Analytics = Analytics;
//# sourceMappingURL=analytics.js.map