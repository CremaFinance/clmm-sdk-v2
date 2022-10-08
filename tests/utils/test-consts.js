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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSITION_NFT_UPDATE_AUTHORITY = exports.MAX_U64 = exports.ONE_SOL = exports.ZERO_BN = exports.TEST_TOKEN_PROGRAM_ID = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const spl_token_1 = require("@solana/spl-token");
exports.TEST_TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(spl_token_1.TOKEN_PROGRAM_ID.toString());
exports.ZERO_BN = new anchor.BN(0);
exports.ONE_SOL = 1000000000;
exports.MAX_U64 = new spl_token_1.u64(new anchor.BN(2).pow(new anchor.BN(64).sub(new anchor.BN(1))).toString());
exports.POSITION_NFT_UPDATE_AUTHORITY = new anchor.web3.PublicKey("5QW9BCx6oZKjSWCVyBZaVU8N4jwtFnged9TsiaXvDj8Q");
