import type { PublicKey } from "@solana/web3.js";

export type TokenMintAddress = string;

export declare type QuoteMintToRefferrer = Map<TokenMintAddress, PublicKey>;

export type CremaClmmParams = {
  slippageTolerance: number;
  decimalA: number;
  decimalB: number;
};
