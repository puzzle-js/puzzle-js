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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var module_1 = require("../module");
var util_1 = require("../util");
var decorators_1 = require("../decorators");
var enums_1 = require("../enums");
var Storage = /** @class */ (function (_super) {
    __extends(Storage, _super);
    function Storage() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Storage.end = function () {
        return __awaiter(this, void 0, void 0, function () {
            var applicationCacheStorageList;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Storage.printApplicationCacheInfo()];
                    case 1:
                        applicationCacheStorageList = _a.sent();
                        util_1.Util.wrapGroup('PuzzleJs', 'Debug Mode - Storage', function () {
                            if (window.caches) {
                                util_1.Util.wrapGroup('PuzzleJs', 'Application Cache', function () {
                                    util_1.Util.table(applicationCacheStorageList);
                                });
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    Storage.printApplicationCacheInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var cacheNames, storageList, sizePromises;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, caches.keys()];
                    case 1:
                        cacheNames = _a.sent();
                        storageList = {
                            total: 0
                        };
                        sizePromises = cacheNames.map(function (cacheName) { return __awaiter(_this, void 0, void 0, function () {
                            var _this = this;
                            var cache, keys, cacheSize;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, caches.open(cacheName)];
                                    case 1:
                                        cache = _a.sent();
                                        return [4 /*yield*/, cache.keys()];
                                    case 2:
                                        keys = _a.sent();
                                        cacheSize = 0;
                                        return [4 /*yield*/, Promise.all(keys.map(function (key) { return __awaiter(_this, void 0, void 0, function () {
                                                var response, blob;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, cache.match(key)];
                                                        case 1:
                                                            response = _a.sent();
                                                            return [4 /*yield*/, response.blob()];
                                                        case 2:
                                                            blob = _a.sent();
                                                            storageList.total += blob.size;
                                                            cacheSize += blob.size;
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); }))];
                                    case 3:
                                        _a.sent();
                                        storageList[cacheName] = cacheSize + " bytes";
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(sizePromises)];
                    case 2:
                        _a.sent();
                        storageList.total = storageList.total + " bytes";
                        return [2 /*return*/, storageList];
                }
            });
        });
    };
    __decorate([
        decorators_1.on(enums_1.EVENT.ON_PAGE_LOAD)
    ], Storage, "end", null);
    return Storage;
}(module_1.Module));
exports.Storage = Storage;
//# sourceMappingURL=storage.js.map