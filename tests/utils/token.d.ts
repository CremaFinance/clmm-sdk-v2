/// <reference types="@solana/web3.js" />
/// <reference types="bn.js" />
import type { BN } from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import type { Provider, TransactionReceipt } from "@cremafinance/solana-contrib";
import type { AuthorityType } from "@solana/spl-token";
import { u64 } from "@solana/spl-token";
export declare function createMint(provider: Provider, authority?: web3.PublicKey): Promise<web3.PublicKey>;
export declare function createMintInstructions(provider: Provider, authority: web3.PublicKey, mint: web3.PublicKey): Promise<web3.TransactionInstruction[]>;
export declare function createTokenAccount(provider: Provider, mint: web3.PublicKey, owner?: web3.PublicKey): Promise<web3.PublicKey>;
export declare function createAssociatedTokenAccount(provider: Provider, mint: web3.PublicKey, owner: web3.PublicKey, payer?: web3.PublicKey): Promise<web3.PublicKey>;
/**
 * Mints tokens to the specified destination token account.
 * @param provider An anchor AnchorProvider object used to send transactions
 * @param mint Mint address of the token
 * @param destination Destination token account to receive tokens
 * @param amount Number of tokens to mint
 */
export declare function mintToByAuthority(provider: Provider, mint: web3.PublicKey, destination: web3.PublicKey, amount: number | BN): Promise<TransactionReceipt>;
/**
 * Creates a token account for the mint and mints the specified amount of tokens into the token account.
 * The caller is assumed to be the mint authority.
 * @param provider An anchor AnchorProvider object used to send transactions
 * @param mint The mint address of the token
 * @param amount Number of tokens to mint to the newly created token account
 */
export declare function createAndMintToTokenAccount(provider: Provider, mint: web3.PublicKey, amount: number | BN): Promise<web3.PublicKey>;
export declare function createAndMintToAssociatedTokenAccount(provider: Provider, mint: web3.PublicKey, amount: number | BN, destinationWallet?: web3.PublicKey, payer?: web3.PublicKey): Promise<web3.PublicKey>;
export declare function getTokenBalance(provider: Provider, vault: web3.PublicKey): Promise<string>;
export declare function approveToken(provider: Provider, tokenAccount: web3.PublicKey, delegate: web3.PublicKey, amount: number | u64, owner?: web3.Keypair): Promise<TransactionReceipt>;
export declare function setAuthority(provider: Provider, tokenAccount: web3.PublicKey, newAuthority: web3.PublicKey, authorityType: AuthorityType, authority?: web3.Keypair): Promise<TransactionReceipt>;
export declare function transfer(provider: Provider, source: web3.PublicKey, destination: web3.PublicKey, amount: number): Promise<TransactionReceipt>;
