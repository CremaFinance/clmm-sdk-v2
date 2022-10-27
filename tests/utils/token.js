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
Object.defineProperty(exports, "__esModule", { value: true });
exports.transfer = exports.setAuthority = exports.approveToken = exports.getTokenBalance = exports.createAndMintToAssociatedTokenAccount = exports.createAndMintToTokenAccount = exports.mintToByAuthority = exports.createAssociatedTokenAccount = exports.createTokenAccount = exports.createMintInstructions = exports.createMint = void 0;
const anchor_1 = require("@project-serum/anchor");
const solana_contrib_1 = require("@cremafinance/solana-contrib");
const spl_token_1 = require("@solana/spl-token");
const ata_utils_1 = require("../../src/utils/ata-utils");
const test_consts_1 = require("./test-consts");
const utils_1 = require("./utils");
function createMint(provider, authority) {
    return __awaiter(this, void 0, void 0, function* () {
        if (authority === undefined) {
            authority = provider.wallet.publicKey;
        }
        const mint = anchor_1.web3.Keypair.generate();
        const instructions = yield createMintInstructions(provider, authority, mint.publicKey);
        const tx = new anchor_1.web3.Transaction();
        tx.add(...instructions);
        yield provider.send(tx, [mint], { commitment: "confirmed" });
        return mint.publicKey;
    });
}
exports.createMint = createMint;
function createMintInstructions(provider, authority, mint) {
    return __awaiter(this, void 0, void 0, function* () {
        const instructions = [
            anchor_1.web3.SystemProgram.createAccount({
                fromPubkey: provider.wallet.publicKey,
                newAccountPubkey: mint,
                space: 82,
                lamports: yield provider.connection.getMinimumBalanceForRentExemption(82),
                programId: test_consts_1.TEST_TOKEN_PROGRAM_ID,
            }),
            spl_token_1.Token.createInitMintInstruction(test_consts_1.TEST_TOKEN_PROGRAM_ID, mint, 0, authority, null),
        ];
        return instructions;
    });
}
exports.createMintInstructions = createMintInstructions;
function createTokenAccount(provider, mint, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenAccount = anchor_1.web3.Keypair.generate();
        const ixs = yield createTokenAccountInstrs(provider, tokenAccount.publicKey, mint, owner || provider.wallet.publicKey);
        const tx = new solana_contrib_1.TransactionEnvelope(provider, ixs);
        // newAccountPubkey isSigner.
        tx.addSigners(tokenAccount);
        yield (0, utils_1.confirmTx)(tx);
        return tokenAccount.publicKey;
    });
}
exports.createTokenAccount = createTokenAccount;
function createTokenAccountInstrs(provider, newAccountPubkey, mint, owner, lamports) {
    return __awaiter(this, void 0, void 0, function* () {
        if (lamports === undefined) {
            lamports = yield provider.connection.getMinimumBalanceForRentExemption(165);
        }
        return [
            anchor_1.web3.SystemProgram.createAccount({
                fromPubkey: provider.wallet.publicKey,
                newAccountPubkey,
                lamports,
                space: 165,
                programId: test_consts_1.TEST_TOKEN_PROGRAM_ID,
            }),
            spl_token_1.Token.createInitAccountInstruction(test_consts_1.TEST_TOKEN_PROGRAM_ID, mint, newAccountPubkey, owner),
        ];
    });
}
function createAssociatedTokenAccount(provider, mint, owner, payer) {
    return __awaiter(this, void 0, void 0, function* () {
        const ataAddress = yield (0, ata_utils_1.deriveATA)(owner, mint);
        const tx = new solana_contrib_1.TransactionEnvelope(provider, [
            spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, ataAddress, owner, payer || provider.wallet.publicKey),
        ]);
        yield (0, utils_1.confirmTx)(tx);
        return ataAddress;
    });
}
exports.createAssociatedTokenAccount = createAssociatedTokenAccount;
/**
 * Mints tokens to the specified destination token account.
 * @param provider An anchor AnchorProvider object used to send transactions
 * @param mint Mint address of the token
 * @param destination Destination token account to receive tokens
 * @param amount Number of tokens to mint
 */
function mintToByAuthority(provider, mint, destination, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new solana_contrib_1.TransactionEnvelope(provider, [
            spl_token_1.Token.createMintToInstruction(spl_token_1.TOKEN_PROGRAM_ID, mint, destination, provider.wallet.publicKey, [], amount),
        ]);
        const receipt = yield (0, utils_1.confirmTx)(tx);
        return receipt;
    });
}
exports.mintToByAuthority = mintToByAuthority;
/**
 * Creates a token account for the mint and mints the specified amount of tokens into the token account.
 * The caller is assumed to be the mint authority.
 * @param provider An anchor AnchorProvider object used to send transactions
 * @param mint The mint address of the token
 * @param amount Number of tokens to mint to the newly created token account
 */
function createAndMintToTokenAccount(provider, mint, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenAccount = yield createTokenAccount(provider, mint, provider.wallet.publicKey);
        yield mintToByAuthority(provider, mint, tokenAccount, new spl_token_1.u64(amount.toString()));
        return tokenAccount;
    });
}
exports.createAndMintToTokenAccount = createAndMintToTokenAccount;
function createAndMintToAssociatedTokenAccount(provider, mint, amount, destinationWallet, payer) {
    return __awaiter(this, void 0, void 0, function* () {
        const destinationWalletKey = destinationWallet
            ? destinationWallet
            : provider.wallet.publicKey;
        const payerKey = payer ? payer : provider.wallet.publicKey;
        const tokenAccount = yield createAssociatedTokenAccount(provider, mint, destinationWalletKey, payerKey);
        yield mintToByAuthority(provider, mint, tokenAccount, new spl_token_1.u64(amount.toString()));
        return tokenAccount;
    });
}
exports.createAndMintToAssociatedTokenAccount = createAndMintToAssociatedTokenAccount;
function getTokenBalance(provider, vault) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield provider.connection.getTokenAccountBalance(vault, "confirmed"))
            .value.amount;
    });
}
exports.getTokenBalance = getTokenBalance;
function approveToken(provider, tokenAccount, delegate, amount, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new solana_contrib_1.TransactionEnvelope(provider, [
            spl_token_1.Token.createApproveInstruction(spl_token_1.TOKEN_PROGRAM_ID, tokenAccount, delegate, (owner === null || owner === void 0 ? void 0 : owner.publicKey) || provider.wallet.publicKey, [], amount),
        ]);
        if (owner) {
            tx.addSigners(owner);
        }
        const receipt = yield (0, utils_1.confirmTx)(tx);
        return receipt;
    });
}
exports.approveToken = approveToken;
function setAuthority(provider, tokenAccount, newAuthority, authorityType, authority) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new solana_contrib_1.TransactionEnvelope(provider, [
            spl_token_1.Token.createSetAuthorityInstruction(spl_token_1.TOKEN_PROGRAM_ID, tokenAccount, newAuthority, authorityType, (authority === null || authority === void 0 ? void 0 : authority.publicKey) || provider.wallet.publicKey, []),
        ]);
        if (authority) {
            tx.addSigners(authority);
        }
        const receipt = yield (0, utils_1.confirmTx)(tx);
        return receipt;
    });
}
exports.setAuthority = setAuthority;
function transfer(provider, source, destination, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new solana_contrib_1.TransactionEnvelope(provider, [
            spl_token_1.Token.createTransferInstruction(spl_token_1.TOKEN_PROGRAM_ID, source, destination, provider.wallet.publicKey, [], amount),
        ]);
        const receipt = yield (0, utils_1.confirmTx)(tx);
        return receipt;
    });
}
exports.transfer = transfer;
