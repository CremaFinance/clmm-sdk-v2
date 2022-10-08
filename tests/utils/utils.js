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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMessage = exports.loadProvider = exports.keypairFromFile = exports.confirmTx = void 0;
const solana_contrib_1 = require("@saberhq/solana-contrib");
const web3_js_1 = require("@solana/web3.js");
const fs = __importStar(require("fs"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const yaml_1 = require("yaml");
function confirmTx(tx) {
    return __awaiter(this, void 0, void 0, function* () {
        const opt = {
            skipPreflight: true,
            commitment: "confirmed",
            preflightCommitment: "confirmed",
            maxRetries: 30,
            printLogs: true,
        };
        return yield tx.confirm(opt);
    });
}
exports.confirmTx = confirmTx;
function keypairFromFile(path) {
    const secret = fs.readFileSync(path, "utf-8");
    const arr = JSON.parse(secret);
    return web3_js_1.Keypair.fromSecretKey(Uint8Array.from(arr));
}
exports.keypairFromFile = keypairFromFile;
function loadProvider() {
    (0, tiny_invariant_1.default)(process.env.HOME !== undefined);
    const home = process.env.HOME;
    const configFile = fs.readFileSync(`${home}/.config/solana/cli/config.yml`, "utf8");
    const config = (0, yaml_1.parse)(configFile);
    const url = getURL(config.json_rpc_url);
    const wallet = new solana_contrib_1.SignerWallet(keypairFromFile(config.keypair_path));
    const provider = solana_contrib_1.SolanaProvider.init({
        connection: new web3_js_1.Connection(url, {
            commitment: "recent",
            disableRetryOnRateLimit: true,
            confirmTransactionInitialTimeout: 60 * 1000,
        }),
        wallet,
        opts: {
            preflightCommitment: "recent",
            commitment: "recent",
        },
    });
    return provider;
}
exports.loadProvider = loadProvider;
function getURL(cluster) {
    switch (cluster) {
        case "devnet": {
            return "https://api.devnet.rpcpool.com/2ee3d7c0b48f6c361a06459b1d77";
        }
        case "testnet":
        case "mainnet-beta": {
            return (0, web3_js_1.clusterApiUrl)(cluster, true);
        }
        case "localnet": {
            return "http://localhost:8899";
        }
    }
    return cluster;
}
function parseMessage(message) {
    const index0 = message.indexOf("Custom");
    const index1 = message.indexOf("}]}})");
    const error_code = message.substring(index0 + 8, index1);
    return error_code;
}
exports.parseMessage = parseMessage;
