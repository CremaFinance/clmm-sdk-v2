"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.ClmmpoolImpl = exports.INIT_KEY = void 0;
var web3_js_1 = require("@solana/web3.js");
var spl_token_1 = require("@solana/spl-token");
var anchor_1 = require("@project-serum/anchor");
var solana_contrib_1 = require("@saberhq/solana-contrib");
var token_utils_1 = require("@saberhq/token-utils");
var util_1 = require("./util");
var tiny_invariant_1 = require("tiny-invariant");
var pda_1 = require("../utils/pda");
exports.INIT_KEY = new web3_js_1.PublicKey("11111111111111111111111111111111");
var ix_1 = require("../ix");
var constants_1 = require("../types/constants");
var address_util_1 = require("../utils/address-util");
var swap_1 = require("../utils/swap");
var token_utils_2 = require("../utils/token-utils");
var tick_1 = require("../utils/tick");
var ClmmpoolImpl = /** @class */ (function () {
    function ClmmpoolImpl(ctx, fetcher, address, tokenAInfo, tokenBInfo, tokenVaultAInfo, tokenVaultBInfo, data) {
        this.ctx = ctx;
        this.fetcher = fetcher;
        this.address = address;
        this.tokenAInfo = tokenAInfo;
        this.tokenBInfo = tokenBInfo;
        this.tokenVaultAInfo = tokenVaultAInfo;
        this.tokenVaultBInfo = tokenVaultBInfo;
        this.data = data;
    }
    ClmmpoolImpl.prototype.getAddress = function () {
        return this.address;
    };
    ClmmpoolImpl.prototype.getData = function () {
        return this.data;
    };
    ClmmpoolImpl.prototype.getTokenAInfo = function () {
        return this.tokenAInfo;
    };
    ClmmpoolImpl.prototype.getTokenBInfo = function () {
        return this.tokenBInfo;
    };
    ClmmpoolImpl.prototype.getTokenVaultAInfo = function () {
        return this.tokenVaultAInfo;
    };
    ClmmpoolImpl.prototype.getTokenVaultBInfo = function () {
        return this.tokenVaultBInfo;
    };
    ClmmpoolImpl.prototype.refreshData = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.refresh()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.data];
                }
            });
        });
    };
    ClmmpoolImpl.prototype.openPosition = function (tickLower, tickUpper, liquidityInput, isAFixed) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.refresh()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.getOpenPositionTx(tickLower, tickUpper, liquidityInput, isAFixed)];
                }
            });
        });
    };
    ClmmpoolImpl.prototype.getOpenPositionTx = function (tickLower, tickUpper, liquidityInput, isAFixed) {
        return __awaiter(this, void 0, Promise, function () {
            var liquidity, tokenMaxA, tokenMaxB, clmmpool, instructions, positionNftMint, positionPda, metadataPda, positionAta, positionEdition, openPositionParams, positionIx, accountATAs, tickArrayLower, tickArrayUpper, tickArrayInstructions, tickArrayMap, isTickArrayMapInit, initTickArrayMapIx, isTickLowerArrayInit, initTickArrayIx, isTickUpperArrayInit, initTickArrayIx, liquidityInputWithFixedToken, increaseLiquidityParams, liquidityIx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tiny_invariant_1["default"](tickLower <= tickUpper, "The tickLower must be less than tickUpper");
                        tiny_invariant_1["default"](tick_1.TickUtil.checkTickInBounds(tickLower), "tickLower is out of bounds.");
                        tiny_invariant_1["default"](tick_1.TickUtil.checkTickInBounds(tickUpper), "tickUpper is out of bounds.");
                        liquidity = liquidityInput.liquidityAmount, tokenMaxA = liquidityInput.tokenMaxA, tokenMaxB = liquidityInput.tokenMaxB;
                        tiny_invariant_1["default"](liquidity.gt(new anchor_1.BN(0)), "liquidity must be greater than zero");
                        return [4 /*yield*/, this.fetcher.getPool(this.address, false)];
                    case 1:
                        clmmpool = _a.sent();
                        if (!clmmpool) {
                            throw new Error("clmmpool not found: " + this.address.toBase58());
                        }
                        tiny_invariant_1["default"](tick_1.TickUtil.isTickInitializable(tickLower, clmmpool.tickSpacing), "lower tick " + tickLower + " is not an initializable tick for tick-spacing " + clmmpool.tickSpacing);
                        tiny_invariant_1["default"](tick_1.TickUtil.isTickInitializable(tickUpper, clmmpool.tickSpacing), "upper tick " + tickUpper + " is not an initializable tick for tick-spacing " + clmmpool.tickSpacing);
                        instructions = [];
                        positionNftMint = web3_js_1.Keypair.generate();
                        positionPda = pda_1.PDAUtil.getPositionPDA(this.ctx.program.programId, positionNftMint.publicKey);
                        metadataPda = pda_1.PDAUtil.getPositionMetadataPDA(positionNftMint.publicKey);
                        return [4 /*yield*/, token_utils_1.getOrCreateATAs({
                                provider: this.ctx.provider, mints: {
                                    positionNftMint: positionNftMint.publicKey
                                }
                            })];
                    case 2:
                        positionAta = _a.sent();
                        positionEdition = pda_1.PDAUtil.getPositionEditionPDA(positionNftMint.publicKey).publicKey;
                        openPositionParams = {
                            tickLowerIndex: tickLower,
                            tickUpperIndex: tickUpper,
                            owner: this.ctx.wallet.publicKey,
                            clmmpool: this.getAddress(),
                            position: positionPda.publicKey,
                            positionNftMint: positionNftMint.publicKey,
                            positionMetadataAccount: metadataPda.publicKey,
                            positionNftUpdateAuthority: constants_1.POSITION_NFT_UPDATE_AUTHORITY,
                            positionAta: positionAta.accounts.positionNftMint,
                            positionEdition: positionEdition
                        };
                        positionIx = ix_1.ClmmpoolIx.openPositionIx(this.ctx.program, openPositionParams);
                        instructions.push(positionIx);
                        return [4 /*yield*/, token_utils_1.getOrCreateATAs({
                                provider: this.ctx.provider,
                                mints: {
                                    tokenA: clmmpool.tokenA,
                                    tokenB: clmmpool.tokenB
                                },
                                owner: this.ctx.provider.wallet.publicKey
                            })];
                    case 3:
                        accountATAs = _a.sent();
                        instructions.push.apply(instructions, accountATAs.instructions);
                        tickArrayLower = pda_1.PDAUtil.getTickArrayPDA(this.ctx.program.programId, this.address, tick_1.TickUtil.getArrayIndex(tickLower, clmmpool.tickSpacing)).publicKey;
                        tickArrayUpper = pda_1.PDAUtil.getTickArrayPDA(this.ctx.program.programId, this.address, tick_1.TickUtil.getArrayIndex(tickUpper, clmmpool.tickSpacing)).publicKey;
                        tickArrayInstructions = [];
                        tickArrayMap = pda_1.PDAUtil.getTickArrayMapPDA(this.ctx.program.programId, this.address).publicKey;
                        return [4 /*yield*/, tick_1.TickArrayUtil.isTickArrayInitialized(tickArrayMap, this.ctx.provider)];
                    case 4:
                        isTickArrayMapInit = _a.sent();
                        if (!isTickArrayMapInit) {
                            initTickArrayMapIx = ix_1.ClmmpoolIx.createTickArrayMapIx(this.ctx.program, {
                                payer: this.ctx.wallet.publicKey,
                                clmmpool: this.address,
                                tickArrayMap: tickArrayMap
                            });
                            tickArrayInstructions.push(initTickArrayMapIx);
                        }
                        return [4 /*yield*/, tick_1.TickArrayUtil.isTickArrayInitialized(tickArrayLower, this.ctx.provider)];
                    case 5:
                        isTickLowerArrayInit = _a.sent();
                        if (!!isTickLowerArrayInit) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.initTickArrayForTicks(tickLower, tickArrayLower)];
                    case 6:
                        initTickArrayIx = _a.sent();
                        tickArrayInstructions.push.apply(tickArrayInstructions, initTickArrayIx.instructions);
                        _a.label = 7;
                    case 7:
                        if (!(tickArrayLower.toBase58() !== tickArrayUpper.toBase58())) return [3 /*break*/, 10];
                        return [4 /*yield*/, tick_1.TickArrayUtil.isTickArrayInitialized(tickArrayUpper, this.ctx.provider)];
                    case 8:
                        isTickUpperArrayInit = _a.sent();
                        if (!!isTickUpperArrayInit) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.initTickArrayForTicks(tickUpper, tickArrayUpper)];
                    case 9:
                        initTickArrayIx = _a.sent();
                        tickArrayInstructions.push.apply(tickArrayInstructions, initTickArrayIx.instructions);
                        _a.label = 10;
                    case 10:
                        if (tickArrayInstructions && tickArrayInstructions.length > 0) {
                            instructions.push.apply(instructions, tickArrayInstructions);
                        }
                        liquidityInputWithFixedToken = {
                            tokenA: tokenMaxA,
                            tokenB: tokenMaxB,
                            isAFixed: isAFixed
                        };
                        increaseLiquidityParams = {
                            liquidityInputWithFixedToken: liquidityInputWithFixedToken,
                            owner: this.ctx.wallet.publicKey,
                            clmmpool: this.getAddress(),
                            position: positionPda.publicKey,
                            positionAta: positionAta.accounts.positionNftMint,
                            tokenAAta: accountATAs.accounts.tokenA,
                            tokenBAta: accountATAs.accounts.tokenB,
                            tokenAVault: clmmpool.tokenAVault,
                            tokenBVault: clmmpool.tokenBVault,
                            tickArrayLower: tickArrayLower,
                            tickArrayUpper: tickArrayUpper,
                            tickArrayMap: tickArrayMap
                        };
                        liquidityIx = ix_1.ClmmpoolIx.increaseLiquidityWithFixedTokenIx(this.ctx.program, increaseLiquidityParams);
                        instructions.push(liquidityIx);
                        return [2 /*return*/, new solana_contrib_1.TransactionEnvelope(this.ctx.provider, instructions, [positionNftMint])];
                }
            });
        });
    };
    ClmmpoolImpl.prototype.closePosition = function (liquidityInput, positionId, positionNftMint, swapKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.refresh()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.getClosePositionIx(liquidityInput, positionId, positionNftMint, swapKey)];
                }
            });
        });
    };
    ClmmpoolImpl.prototype.getClosePositionIx = function (liquidityInput, positionId, positionNftMint, swapKey) {
        return __awaiter(this, void 0, void 0, function () {
            var position, clmmpool, wallet, positionAta, accountATAs, decreaseLiquidityIx, tickUpper, tickLower, tickArrayLower, tickArrayUpper, metadataPda, cliamIx, collectRewarderIxResult, i, rewarderAta, collectRewarderIx, positionEdition, closePositionIx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fetcher.getPosition(positionId)];
                    case 1:
                        position = _a.sent();
                        if (!position) {
                            throw new Error("Position not found: " + positionId.toBase58());
                        }
                        return [4 /*yield*/, this.fetcher.getPool(swapKey, true)];
                    case 2:
                        clmmpool = _a.sent();
                        if (!clmmpool) {
                            throw new Error("Unable to fetch clmmpool for this position.");
                        }
                        wallet = this.ctx.provider.wallet.publicKey;
                        return [4 /*yield*/, token_utils_1.getOrCreateATAs({ provider: this.ctx.provider, mints: { positionAddress: positionNftMint }, owner: wallet })];
                    case 3:
                        positionAta = _a.sent();
                        return [4 /*yield*/, token_utils_1.getOrCreateATAs({
                                provider: this.ctx.provider,
                                mints: {
                                    tokenA: clmmpool.tokenA,
                                    tokenB: clmmpool.tokenB
                                },
                                owner: wallet
                            })];
                    case 4:
                        accountATAs = _a.sent();
                        decreaseLiquidityIx = new solana_contrib_1.TransactionEnvelope(this.ctx.provider, [ix_1.ClmmpoolIx.decreaseLiquidityIx(this.ctx.program, {
                                liquidityInput: liquidityInput,
                                owner: wallet,
                                clmmpool: swapKey,
                                position: positionId,
                                positionAta: positionAta.accounts.positionAddress,
                                tokenAAta: accountATAs.accounts.tokenA,
                                tokenBAta: accountATAs.accounts.tokenB,
                                tokenAVault: clmmpool.tokenAVault,
                                tokenBVault: clmmpool.tokenBVault,
                                tickArrayLower: pda_1.PDAUtil.getTickArrayPDA(this.ctx.program.programId, swapKey, tick_1.TickUtil.getArrayIndex(position.tickLowerIndex, clmmpool.tickSpacing)).publicKey,
                                tickArrayUpper: pda_1.PDAUtil.getTickArrayPDA(this.ctx.program.programId, swapKey, tick_1.TickUtil.getArrayIndex(position.tickUpperIndex, clmmpool.tickSpacing)).publicKey,
                                tickArrayMap: pda_1.PDAUtil.getTickArrayMapPDA(this.ctx.program.programId, swapKey).publicKey
                            })]);
                        tickUpper = position.tickLowerIndex;
                        tickLower = position.tickUpperIndex;
                        console.log(tickLower, 'tickLower##');
                        tickArrayLower = pda_1.PDAUtil.getTickArrayPDA(this.ctx.program.programId, swapKey, tick_1.TickUtil.getArrayIndex(tickLower, clmmpool.tickSpacing)).publicKey;
                        tickArrayUpper = pda_1.PDAUtil.getTickArrayPDA(this.ctx.program.programId, swapKey, tick_1.TickUtil.getArrayIndex(tickUpper, clmmpool.tickSpacing)).publicKey;
                        metadataPda = pda_1.PDAUtil.getPositionMetadataPDA(positionNftMint);
                        cliamIx = new solana_contrib_1.TransactionEnvelope(this.ctx.provider, [
                            ix_1.ClmmpoolIx.collectFeeIx(this.ctx.program, {
                                owner: wallet,
                                clmmpool: swapKey,
                                position: positionId,
                                positionAta: positionAta.accounts.positionAddress,
                                tokenAAta: accountATAs.accounts.tokenA,
                                tokenBAta: accountATAs.accounts.tokenB,
                                tokenAVault: clmmpool.tokenAVault,
                                tokenBVault: clmmpool.tokenBVault,
                                tickArrayLower: tickArrayLower,
                                tickArrayUpper: tickArrayUpper
                            })
                        ]);
                        collectRewarderIxResult = [];
                        i = 0;
                        _a.label = 5;
                    case 5:
                        if (!(i < 3)) return [3 /*break*/, 8];
                        return [4 /*yield*/, token_utils_1.getOrCreateATA({ provider: this.ctx.provider, mint: clmmpool.rewarderInfos[i].mint, owner: wallet })];
                    case 6:
                        rewarderAta = _a.sent();
                        if (rewarderAta && rewarderAta.instruction) {
                            collectRewarderIxResult.push(rewarderAta.instruction);
                        }
                        collectRewarderIx = ix_1.ClmmpoolIx.collectRewarderIx(this.ctx.program, {
                            owner: wallet,
                            clmmpool: swapKey,
                            position: positionId,
                            positionAta: positionAta.accounts.positionAddress,
                            rewarderAta: rewarderAta.address,
                            mintWrapper: clmmpool.rewarderInfos[i].mintWrapper,
                            minter: clmmpool.rewarderInfos[i].minter,
                            rewardsTokenMint: clmmpool.rewarderInfos[i].mint,
                            tickArrayLower: tickArrayLower,
                            tickArrayUpper: tickArrayUpper
                        });
                        collectRewarderIxResult.push(collectRewarderIx);
                        _a.label = 7;
                    case 7:
                        i++;
                        return [3 /*break*/, 5];
                    case 8:
                        positionEdition = pda_1.PDAUtil.getPositionEditionPDA(positionNftMint).publicKey;
                        closePositionIx = new solana_contrib_1.TransactionEnvelope(this.ctx.provider, __spreadArrays(decreaseLiquidityIx.instructions, cliamIx.instructions, [
                            ix_1.ClmmpoolIx.removePositionIx(this.ctx.program, {
                                owner: wallet,
                                position: positionId,
                                positionNftMint: positionNftMint,
                                positionAta: positionAta.accounts.positionAddress,
                                positionMetadataAccount: metadataPda.publicKey,
                                positionEdition: positionEdition
                            })
                        ]));
                        return [2 /*return*/, closePositionIx];
                }
            });
        });
    };
    ClmmpoolImpl.prototype.initTickArrayForTicks = function (arrayIndex, tickArrayPda) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.refresh()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.getInitTickArrayForTicks(arrayIndex, tickArrayPda)];
                }
            });
        });
    };
    ClmmpoolImpl.prototype.getInitTickArrayForTicks = function (arrayIndex, tickArrayPda) {
        return __awaiter(this, void 0, void 0, function () {
            var createTickArrayIx;
            return __generator(this, function (_a) {
                createTickArrayIx = new solana_contrib_1.TransactionEnvelope(this.ctx.provider, [ix_1.ClmmpoolIx.createTickArrayIx(this.ctx.program, {
                        arrayIndex: tick_1.TickUtil.getArrayIndex(arrayIndex, this.data.tickSpacing),
                        payer: this.ctx.provider.wallet.publicKey,
                        clmmpool: this.address,
                        tickArray: tickArrayPda
                    })]);
                return [2 /*return*/, createTickArrayIx];
            });
        });
    };
    ClmmpoolImpl.prototype.swap = function (quote, sourceWallet) {
        return __awaiter(this, void 0, Promise, function () {
            var sourceWalletKey;
            return __generator(this, function (_a) {
                sourceWalletKey = sourceWallet
                    ? address_util_1.AddressUtil.toPubKey(sourceWallet)
                    : this.ctx.wallet.publicKey;
                return [2 /*return*/, this.getSwapTx(quote, sourceWalletKey)];
            });
        });
    };
    ClmmpoolImpl.prototype.getSwapTx = function (input, wallet) {
        return __awaiter(this, void 0, Promise, function () {
            var clmmpool, accountATAs, tickArrayMap, sqrtPriceLimit, tickArrayIndex, remainAccount, tx, wrapSOLTx, unwrapSOLTx, unwrapSOLTx, unwrapSOLTx, wrapSOLTx, unwrapSOLTx;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        clmmpool = this.data;
                        return [4 /*yield*/, token_utils_1.getOrCreateATAs({
                                provider: this.ctx.provider,
                                mints: {
                                    tokenA: clmmpool.tokenA,
                                    tokenB: clmmpool.tokenB
                                },
                                owner: wallet
                            })];
                    case 1:
                        accountATAs = _g.sent();
                        tickArrayMap = pda_1.PDAUtil.getTickArrayMapPDA(this.ctx.program.programId, this.address);
                        sqrtPriceLimit = swap_1.SwapUtils.getDefaultSqrtPriceLimit(input.aToB);
                        tickArrayIndex = tick_1.TickUtil.getArrayIndex(this.data.currentTickIndex, this.data.tickSpacing);
                        return [4 /*yield*/, tick_1.createTickArrayRange(this.ctx, this.address, tickArrayIndex, 0, input.aToB)
                            // const tickArrays = [];
                            // for (const r of remainAccount) {
                            //   const tickArrayData = await this.ctx.fetcher.getTickArray(r);
                            //   const tickArray: TickArray = {
                            //     address: r,
                            //     data: tickArrayData,
                            //   };
                            //   tickArrays.push(tickArray);
                            // }
                        ];
                    case 2:
                        remainAccount = _g.sent();
                        tx = new solana_contrib_1.TransactionEnvelope(this.ctx.provider, __spreadArrays(accountATAs.instructions, [ix_1.ClmmpoolIx.swapIx(this.ctx.program, {
                                aToB: input.aToB,
                                byAmountIn: input.byAmountIn,
                                amount: new anchor_1.BN(input.amount.toString()),
                                amountLimit: new anchor_1.BN(input.amountLimit.toString()),
                                sqrtPriceLimit: sqrtPriceLimit,
                                clmmpool: this.address,
                                tokenA: clmmpool.tokenA,
                                tokenB: clmmpool.tokenB,
                                accountA: accountATAs.accounts.tokenA,
                                accountB: accountATAs.accounts.tokenB,
                                tokenAVault: clmmpool.tokenAVault,
                                tokenBVault: clmmpool.tokenBVault,
                                tickArrayMap: tickArrayMap.publicKey,
                                owner: wallet,
                                tickArrays: remainAccount,
                                clmmConfig: pda_1.PDAUtil.getClmmConfigPDA(this.ctx.program.programId).publicKey
                            })]));
                        if (!clmmpool.tokenA.equals(spl_token_1.NATIVE_MINT)) return [3 /*break*/, 7];
                        if (!input.aToB) return [3 /*break*/, 5];
                        return [4 /*yield*/, token_utils_2.TokenUtil.wrapSOL(this.ctx.provider, input.byAmountIn ? input.amount : input.amountLimit)];
                    case 3:
                        wrapSOLTx = _g.sent();
                        (_a = tx.instructions).unshift.apply(_a, wrapSOLTx.instructions);
                        return [4 /*yield*/, token_utils_2.TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenA)];
                    case 4:
                        unwrapSOLTx = _g.sent();
                        (_b = tx.instructions).push.apply(_b, unwrapSOLTx.instructions);
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, token_utils_2.TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenB)];
                    case 6:
                        unwrapSOLTx = _g.sent();
                        (_c = tx.instructions).push.apply(_c, unwrapSOLTx.instructions);
                        _g.label = 7;
                    case 7:
                        if (!clmmpool.tokenB.equals(spl_token_1.NATIVE_MINT)) return [3 /*break*/, 12];
                        if (!input.aToB) return [3 /*break*/, 9];
                        return [4 /*yield*/, token_utils_2.TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenB)];
                    case 8:
                        unwrapSOLTx = _g.sent();
                        (_d = tx.instructions).push.apply(_d, unwrapSOLTx.instructions);
                        return [3 /*break*/, 12];
                    case 9: return [4 /*yield*/, token_utils_2.TokenUtil.wrapSOL(this.ctx.provider, input.byAmountIn ? input.amount : input.amountLimit)];
                    case 10:
                        wrapSOLTx = _g.sent();
                        (_e = tx.instructions).unshift.apply(_e, wrapSOLTx.instructions);
                        return [4 /*yield*/, token_utils_2.TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenA)];
                    case 11:
                        unwrapSOLTx = _g.sent();
                        (_f = tx.instructions).push.apply(_f, unwrapSOLTx.instructions);
                        _g.label = 12;
                    case 12: return [2 /*return*/, tx];
                }
            });
        });
    };
    ClmmpoolImpl.prototype.refresh = function () {
        return __awaiter(this, void 0, void 0, function () {
            var account, _a, tokenVaultAInfo, tokenVaultBInfo;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.fetcher.getPool(this.address, true)];
                    case 1:
                        account = _b.sent();
                        if (!account) return [3 /*break*/, 3];
                        return [4 /*yield*/, util_1.getTokenVaultAccountInfos(this.fetcher, account, true)];
                    case 2:
                        _a = _b.sent(), tokenVaultAInfo = _a[0], tokenVaultBInfo = _a[1];
                        this.data = account;
                        if (tokenVaultAInfo) {
                            this.tokenVaultAInfo = tokenVaultAInfo;
                        }
                        if (tokenVaultBInfo) {
                            this.tokenVaultBInfo = tokenVaultBInfo;
                        }
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ClmmpoolImpl;
}());
exports.ClmmpoolImpl = ClmmpoolImpl;
