"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickSpacing = void 0;
__exportStar(require("./test-builders"), exports);
__exportStar(require("./test-consts"), exports);
__exportStar(require("./token"), exports);
__exportStar(require("./utils"), exports);
// export * from "./assert";
var TickSpacing;
(function (TickSpacing) {
    TickSpacing[TickSpacing["One"] = 1] = "One";
    TickSpacing[TickSpacing["Stable"] = 8] = "Stable";
    TickSpacing[TickSpacing["ThirtyTwo"] = 32] = "ThirtyTwo";
    TickSpacing[TickSpacing["SixtyFour"] = 64] = "SixtyFour";
    TickSpacing[TickSpacing["Standard"] = 128] = "Standard";
})(TickSpacing = exports.TickSpacing || (exports.TickSpacing = {}));
