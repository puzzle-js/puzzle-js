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
var module_1 = require("./module");
var enums_1 = require("./enums");
var decorators_1 = require("./decorators");
var assetHelper_1 = require("./assetHelper");
var Core = /** @class */ (function (_super) {
    __extends(Core, _super);
    function Core() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Core, "_pageConfiguration", {
        get: function () {
            return this.__pageConfiguration;
        },
        set: function (value) {
            this.__pageConfiguration = value;
        },
        enumerable: true,
        configurable: true
    });
    Core.config = function (pageConfiguration) {
        Core.__pageConfiguration = JSON.parse(pageConfiguration);
    };
    /**
     * Renders fragment
     * @param {string} fragmentName
     * @param {string} containerSelector
     * @param {string} replacementContentSelector
     */
    Core.load = function (fragmentName, containerSelector, replacementContentSelector) {
        if (containerSelector && replacementContentSelector) {
            Core.__replace(containerSelector, replacementContentSelector);
        }
    };
    Core.loadAssetsOnFragment = function (fragmentName) {
        var onFragmentRenderAssets = Core.__pageConfiguration.assets.filter(function (asset) { return asset.fragment === fragmentName && asset.loadMethod === enums_1.RESOURCE_LOADING_TYPE.ON_FRAGMENT_RENDER && !asset.preLoaded; });
        var scripts = Core.createLoadQueue(onFragmentRenderAssets);
        assetHelper_1.AssetHelper.loadJsSeries(scripts);
    };
    Core.pageLoaded = function () {
        var onFragmentRenderAssets = Core.__pageConfiguration.assets.filter(function (asset) { return asset.loadMethod === enums_1.RESOURCE_LOADING_TYPE.ON_PAGE_RENDER && !asset.preLoaded; });
        var scripts = Core.createLoadQueue(onFragmentRenderAssets);
        assetHelper_1.AssetHelper.loadJsSeries(scripts);
    };
    Core.onVariables = function (fragmentName, configKey, configData) {
        window[configKey] = configData;
    };
    Core.createLoadQueue = function (assets) {
        var loadList = [];
        assets.forEach(function (asset) {
            if (!asset.preLoaded) {
                asset.preLoaded = true;
                asset.defer = true;
                asset.dependent && asset.dependent.forEach(function (dependencyName) {
                    var dependency = Core.__pageConfiguration.dependencies.filter(function (dependency) { return dependency.name === dependencyName; });
                    if (dependency[0] && !dependency[0].preLoaded) {
                        if (loadList.indexOf(dependency[0]) === -1) {
                            loadList.push(dependency[0]);
                            dependency[0].preLoaded = true;
                        }
                    }
                });
                if (loadList.indexOf(asset) === -1) {
                    loadList.push(asset);
                }
            }
        });
        return loadList;
    };
    /**
     * Replaces container inner with given content.
     * @param {string} containerSelector
     * @param {string} replacementContentSelector
     */
    Core.__replace = function (containerSelector, replacementContentSelector) {
        var z = window.document.querySelector(replacementContentSelector);
        var r = z.innerHTML;
        z.parentNode.removeChild(z);
        window.document.querySelector(containerSelector).innerHTML = r;
    };
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_CONFIG)
    ], Core, "config", null);
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_FRAGMENT_RENDERED)
    ], Core, "load", null);
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_FRAGMENT_RENDERED)
    ], Core, "loadAssetsOnFragment", null);
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_PAGE_LOAD)
    ], Core, "pageLoaded", null);
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_VARIABLES)
    ], Core, "onVariables", null);
    return Core;
}(module_1.Module));
exports.Core = Core;
//# sourceMappingURL=core.js.map