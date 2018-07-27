"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AssetHelper = /** @class */ (function () {
    function AssetHelper() {
    }
    AssetHelper.loadJs = function (asset) {
        var loader = null;
        var scriptTag = document.createElement('script');
        scriptTag.type = 'text/javascript';
        scriptTag.attributes['puzzle-asset'] = asset.name;
        scriptTag.src = asset.link;
        scriptTag.defer = asset.defer || false;
        if (!asset.defer) {
            loader = new Promise(function (resolve, reject) {
                scriptTag.onload = function () {
                    resolve();
                };
            });
        }
        window.document.body.appendChild(scriptTag);
        return loader;
    };
    AssetHelper.loadJsSeries = function (scripts) {
        var _loop_1 = function (i, p) {
            p = p.then(function (_) { return new Promise(function (resolve) {
                var assetLoading = AssetHelper.loadJs(scripts[i]);
                if (!assetLoading) {
                    resolve();
                }
                else {
                    assetLoading.then(function () {
                        resolve();
                    });
                }
            }); });
            out_p_1 = p;
        };
        var out_p_1;
        for (var i = 0, p = Promise.resolve(); i < scripts.length; i++) {
            _loop_1(i, p);
            p = out_p_1;
        }
    };
    AssetHelper.loadCSS = function () {
    };
    return AssetHelper;
}());
exports.AssetHelper = AssetHelper;
//# sourceMappingURL=assetHelper.js.map