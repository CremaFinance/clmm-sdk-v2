import { ClmmpoolData, TickData } from "@cremafinance/crema-sdk-v2/dist/esm/types/clmmpool";
import { computeSwap, TickMath } from "@cremafinance/crema-sdk-v2";
import type { AccountInfo } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import JSBI from "jsbi";

import type { ClmmConfigData, FeeTierData } from "./core";
import { ClmmCoder } from "./core";
import type { Quote, QuoteParams } from "./quote";
import type { CremaClmmParams } from "./type";
import { u64 } from "@cremafinance/token-utils";
import BN = require("bn.js");

const SQRTPRICE_LOWER_X64 = "184467440737095516";
const SQERPRICE_UPPER_X64 = "15793534762490258745";

export const CREMA_PROGRAM_ID = new PublicKey(
  "CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR"
);

export type AccountInfoMap = Map<string, AccountInfo<Buffer> | null>;

interface AMM {
  reserveTokenMints: PublicKey[];
  getAccountsForUpdate(): PublicKey[];
  update(accountInfoMap: AccountInfoMap): void;
  getQuote(quoteParams: QuoteParams): Quote;
}

export class CremaClmm implements AMM {
  label: string;
  id: string;
  reserveTokenMints: PublicKey[];
  reserveTokenDecimals: number[];
  clmmpoolData: ClmmpoolData;
  clmmConfigData: ClmmConfigData;
  feeTierData: FeeTierData;
  slippageTolerance: number;
  protocolFeeRate: number;
  feeRate: number;
  ticks: TickData[];
  private poolAddress: PublicKey;

  // address is clmmpool address
  constructor(
    address: PublicKey,
    clmmpoolInfo: AccountInfo<Buffer>,
    clmmConfigInfo: AccountInfo<Buffer>,
    feeTierInfo: AccountInfo<Buffer>,
    ticks: TickData[],
    cremaParams: CremaClmmParams
  ) {
    this.label = "Crema";
    this.id = address.toBase58();
    this.poolAddress = address;
    this.clmmpoolData = ClmmCoder.accounts.decode(
      "clmmpool",
      clmmpoolInfo.data
      );
    this.clmmConfigData = ClmmCoder.accounts.decode(
      "clmmConfig",
      clmmConfigInfo.data
    );
    this.feeTierData = ClmmCoder.accounts.decode("feeTier", feeTierInfo.data);
    this.feeRate = this.feeTierData.feeRate;
    this.reserveTokenMints = [
      this.clmmpoolData.tokenA,
      this.clmmpoolData.tokenB,
    ];
    this.reserveTokenDecimals = [cremaParams.decimalA, cremaParams.decimalB];
    this.protocolFeeRate = this.clmmConfigData.protocolFeeRate;
    this.ticks = ticks;
    this.slippageTolerance = cremaParams.slippageTolerance;
  }

  getAccountsForUpdate(): PublicKey[] {
    return [this.poolAddress];
  }

  update(accountInfoMap: AccountInfoMap) {
    const clmmpool = accountInfoMap.get(this.id);

    if (!clmmpool) {
      throw new Error("one of the required account is missing");
    }
  }

  getQuote(quoteParams: QuoteParams): Quote {
    let outToken: PublicKey;
    let sqrtPriceLimit: u64;
    let aToB, byAmountIn: boolean;

    if (quoteParams.swapMode === "ExactIn") {
      outToken = quoteParams.destinationMint;
      sqrtPriceLimit = new BN(SQRTPRICE_LOWER_X64);
      byAmountIn = true;
    } else {
      outToken = quoteParams.sourceMint;
      sqrtPriceLimit = new BN(SQERPRICE_UPPER_X64);
      byAmountIn = false;
    }

    const swapResult = computeSwap(aToB, byAmountIn, quoteParams.amount, this.clmmpoolData, this.ticks);

    const beforePrice = TickMath.sqrtPriceX64ToPrice(
      this.clmmpoolData.currentSqrtPrice,
      this.reserveTokenDecimals[0]!,
      this.reserveTokenDecimals[1]!
    ).toNumber();
    const afterPrice = TickMath.sqrtPriceX64ToPrice(
      swapResult.nextSqrtPrice,
      this.reserveTokenDecimals[0]!,
      this.reserveTokenDecimals[1]!
    ).toNumber();

    let isExceed = false;
    if (byAmountIn) {
      isExceed = swapResult.amountIn.lt(quoteParams.amount);
    } else {
      isExceed = swapResult.amountOut.lt(quoteParams.amount);
    }

    return {
      notEnoughLiquidity: isExceed,
      inAmount: JSBI.BigInt(swapResult.amountIn),
      outAmount: JSBI.BigInt(swapResult.amountOut),
      feeMint: outToken.toString(),
      feeAmount: JSBI.multiply(
        JSBI.BigInt(quoteParams.amount),
        JSBI.BigInt(this.feeRate)
      ),
      feePct: this.feeRate,
      priceImpactPct: (Math.abs(beforePrice - afterPrice) / beforePrice) * 100,
    };
  }
}
