import type { PublicKey } from "@solana/web3.js";
import type JSBI from "jsbi";

import type { TokenMintAddress } from "./type";

export enum SwapMode {
  ExactIn = "ExactIn",
  ExactOut = "ExactOut",
}

export interface QuoteParams {
  sourceMint: PublicKey;
  destinationMint: PublicKey;
  amount: JSBI;
  swapMode: SwapMode;
}

export interface Quote {
  notEnoughLiquidity: boolean;
  minInAmount?: JSBI;
  minOutAmount?: JSBI;
  inAmount: JSBI;
  outAmount: JSBI;
  feeAmount: JSBI;
  feeMint: TokenMintAddress;
  feePct: number;
  priceImpactPct: number;
}
