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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDefaultOpenPositionParams = exports.generateDefaultCreatePartnerParams = exports.generateDefaultInitTickArrayMapParams = exports.generateDefaultInitTickArrayParams = exports.generateDefaultInitFeeTierParams = exports.generateDefaultCreatePoolParams = exports.createInOrderMints = exports.generateDefaultConfigParams = void 0;
// import * as anchor from "@project-serum/anchor";
const token_utils_1 = require("@saberhq/token-utils");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const decimal_js_1 = __importDefault(require("decimal.js"));
const src_1 = require("../../src");
const utils_1 = require("../../src/math/utils");
const _1 = require(".");
const generateDefaultConfigParams = (context, payer) => {
    const configKeypairs = {
        protocolAuthorityKeypair: web3_js_1.Keypair.generate(),
        protocolClaimAuthorityKeypair: web3_js_1.Keypair.generate(),
        createPoolAuthorityKeypair: web3_js_1.Keypair.generate(),
    };
    const createPoolAuthority = src_1.PDAUtil.getClmmConfigPDA(context.program.programId);
    const configInitInfo = {
        clmmConfig: createPoolAuthority.publicKey,
        protocolAuthority: configKeypairs.protocolAuthorityKeypair.publicKey,
        protocolFeeClaimAuthority: configKeypairs.protocolClaimAuthorityKeypair.publicKey,
        createPoolAuthority: configKeypairs.createPoolAuthorityKeypair.publicKey,
        protocolFeeRate: 300,
        payer: payer || context.wallet.publicKey,
    };
    return { configInitInfo, configKeypairs };
};
exports.generateDefaultConfigParams = generateDefaultConfigParams;
const createInOrderMints = (context) => __awaiter(void 0, void 0, void 0, function* () {
    const provider = context.provider;
    const tokenXMintPubKey = yield (0, _1.createMint)(provider);
    const tokenYMintPubKey = yield (0, _1.createMint)(provider);
    let tokenMintAPubKey, tokenMintBPubKey;
    if (Buffer.compare(tokenXMintPubKey.toBuffer(), tokenYMintPubKey.toBuffer()) < 0) {
        tokenMintAPubKey = tokenXMintPubKey;
        tokenMintBPubKey = tokenYMintPubKey;
    }
    else {
        tokenMintAPubKey = tokenYMintPubKey;
        tokenMintBPubKey = tokenXMintPubKey;
    }
    return [tokenMintAPubKey, tokenMintBPubKey];
});
exports.createInOrderMints = createInOrderMints;
const generateDefaultCreatePoolParams = (context, configPubkey, feeTierPubkey, tickSpacing, initSqrtPrice = utils_1.MathUtil.toX64(new decimal_js_1.default(5)), payer) => __awaiter(void 0, void 0, void 0, function* () {
    const [tokenMintAPubKey, tokenMintBPubKey] = yield (0, exports.createInOrderMints)(context);
    const clmmpoolPDA = src_1.PDAUtil.getClmmpoolPDA(context.program.programId, configPubkey, tokenMintAPubKey, tokenMintBPubKey, tickSpacing);
    const tokenAVaultATA = yield (0, token_utils_1.getOrCreateATA)({
        provider: context.provider,
        mint: tokenMintAPubKey,
        owner: clmmpoolPDA.publicKey,
    });
    const tokenBVaultATA = yield (0, token_utils_1.getOrCreateATA)({
        provider: context.provider,
        mint: tokenMintBPubKey,
        owner: clmmpoolPDA.publicKey,
    });
    const poolCreateInfo = {
        initSqrtPrice,
        tickSpacing,
        clmmConfig: configPubkey,
        tokenA: tokenMintAPubKey,
        tokenB: tokenMintBPubKey,
        clmmpool: clmmpoolPDA.publicKey,
        tokenAVault: tokenAVaultATA.address,
        tokenBVault: tokenBVaultATA.address,
        feeTier: feeTierPubkey,
        payer: payer || context.wallet.publicKey,
    };
    return { poolCreateInfo };
});
exports.generateDefaultCreatePoolParams = generateDefaultCreatePoolParams;
const generateDefaultInitFeeTierParams = (context, clmmConfig, feeAuthority, tickSpacing, feeRate, feeTier, payer) => {
    const feeTierPDA = src_1.PDAUtil.getFeeTierPDA(context.program.programId, clmmConfig, tickSpacing);
    return {
        payer: payer || context.wallet.publicKey,
        clmmConfig,
        feeTierPDA,
        feeRate,
        feeTier,
        feeAuthority,
        tickSpacing,
    };
};
exports.generateDefaultInitFeeTierParams = generateDefaultInitFeeTierParams;
const generateDefaultInitTickArrayParams = (context, clmmpool, arrayIndex, payer) => {
    const tickArrayPDA = src_1.PDAUtil.getTickArrayPDA(context.program.programId, clmmpool, arrayIndex);
    return {
        clmmpool,
        tickArray: tickArrayPDA.publicKey,
        arrayIndex,
        payer: payer || context.wallet.publicKey,
    };
};
exports.generateDefaultInitTickArrayParams = generateDefaultInitTickArrayParams;
const generateDefaultInitTickArrayMapParams = (context, clmmpool, payer) => {
    const tickArrayMapPDA = src_1.PDAUtil.getTickArrayMapPDA(context.program.programId, clmmpool);
    return {
        clmmpool,
        tickArrayMap: tickArrayMapPDA.publicKey,
        payer: payer || context.wallet.publicKey,
    };
};
exports.generateDefaultInitTickArrayMapParams = generateDefaultInitTickArrayMapParams;
const generateDefaultCreatePartnerParams = (context, base, clmmConfig, protocolAuthority, authority, partner_fee_claim_authority, fee_rate, start_time, end_time, name, payer) => {
    const partnerPDA = src_1.PDAUtil.getPartnerPDA(context.program.programId, base);
    return {
        payer: payer || context.wallet.publicKey,
        clmmConfig,
        protocolAuthority,
        base,
        partner: partnerPDA.publicKey,
        authority,
        partner_fee_claim_authority,
        fee_rate,
        start_time,
        end_time,
        name,
    };
};
exports.generateDefaultCreatePartnerParams = generateDefaultCreatePartnerParams;
function generateDefaultOpenPositionParams(context, clmmpool, tickLowerIndex, tickUpperIndex, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const positionNFTMintKeypair = web3_js_1.Keypair.generate();
        const positionPda = src_1.PDAUtil.getPositionPDA(context.program.programId, positionNFTMintKeypair.publicKey);
        const metadataPda = src_1.PDAUtil.getPositionMetadataPDA(positionNFTMintKeypair.publicKey);
        const positionTokenAccountAddress = yield spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, positionNFTMintKeypair.publicKey, owner || context.wallet.publicKey);
        const params = {
            tickLowerIndex,
            tickUpperIndex,
            owner: owner || context.wallet.publicKey,
            clmmpool,
            position: positionPda.publicKey,
            positionNftMint: positionNFTMintKeypair.publicKey,
            positionMetadataAccount: metadataPda.publicKey,
            positionNftUpdateAuthority: _1.POSITION_NFT_UPDATE_AUTHORITY,
            positionAta: positionTokenAccountAddress,
        };
        return {
            params,
            nftMint: positionNFTMintKeypair,
        };
    });
}
exports.generateDefaultOpenPositionParams = generateDefaultOpenPositionParams;
