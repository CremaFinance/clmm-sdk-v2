import { u64 } from "@solana/spl-token";
import type { AccountInfo } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import JSBI from "jsbi";

import type { SwapQuoteParam } from "../../src";
import {
  PDAUtil,
  simulateSwapWithProFeeRate,
  TickMath,
  TickUtil,
} from "../../src";
import type { TickArray } from "../../src/types";
import type { ClmmConfigData, ClmmPoolData, FeeTierData } from "./core";
import { ClmmCoder } from "./core";
import type { Quote, QuoteParams } from "./quote";
import type { CremaClmmParams } from "./type";

const SQRTPRICE_LOWER_X64 = "184467440737095516";
const SQERPRICE_UPPER_X64 = "15793534762490258745";

export const CREMA_PROGRAM_ID = new PublicKey(
  "CcLs6shXAUPEi19SGyCeEHU9QhYAWzV2dRpPPNA4aRb7"
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
  clmmpoolData: ClmmPoolData;
  clmmConfigData: ClmmConfigData;
  feeTierData: FeeTierData;
  slippageTolerance: number;
  protocolFeeRate: number;
  feeRate: number;
  private poolAddress: PublicKey;
  private tickArrays: TickArray[];

  // address is clmmpool address
  constructor(
    address: PublicKey,
    clmmpoolInfo: AccountInfo<Buffer>,
    clmmConfigInfo: AccountInfo<Buffer>,
    feeTierInfo: AccountInfo<Buffer>,
    cremaParams: CremaClmmParams
  ) {
    this.label = "Crema";
    this.id = address.toBase58();
    this.poolAddress = address;
    this.feeTierData = ClmmCoder.accounts.decode("feeTier", feeTierInfo.data);
    this.clmmpoolData = ClmmCoder.accounts.decode(
      "clmmpool",
      clmmpoolInfo.data
    );
    this.clmmConfigData = ClmmCoder.accounts.decode(
      "clmmConfig",
      clmmConfigInfo.data
    );
    this.feeRate = this.feeTierData.feeRate;
    this.reserveTokenMints = [
      this.clmmpoolData.tokenA,
      this.clmmpoolData.tokenB,
    ];
    this.reserveTokenDecimals = [cremaParams.decimalA, cremaParams.decimalB];
    this.protocolFeeRate = this.clmmConfigData.protocolFeeRate;
    this.tickArrays = [];
    this.slippageTolerance = cremaParams.slippageTolerance;
  }

  getAccountsForUpdate(): PublicKey[] {
    const currArrayIndex = TickUtil.getArrayIndex(
      this.clmmpoolData.currentTickIndex,
      this.clmmpoolData.tickSpacing
    );

    const maxArrayIndex = TickUtil.getArrayIndex(
      TickUtil.getMaxIndex(this.clmmpoolData.tickSpacing),
      this.clmmpoolData.tickSpacing
    );

    const tickArrays: PublicKey[] = [];
    for (let i = 0; i < 5; i++) {
      if (
        currArrayIndex + i - 2 >= 0 &&
        currArrayIndex + i - 2 <= maxArrayIndex
      ) {
        const tickArray = PDAUtil.getTickArrayPDA(
          CREMA_PROGRAM_ID,
          this.poolAddress,
          currArrayIndex + i - 2
        ).publicKey;

        tickArrays.push(tickArray);
      }
    }

    return [this.poolAddress, ...tickArrays];
  }

  update(accountInfoMap: AccountInfoMap) {
    const tickArrayAddresses = this.getAccountsForUpdate().splice(0, 1);
    const tickArrays: TickArray[] = [];
    for (let i = 0; i < tickArrayAddresses.length; i++) {
      const tickArrayAccountInfo = accountInfoMap.get(
        tickArrayAddresses[i]!.toBase58()
      );
      if (tickArrayAccountInfo) {
        const tickArray = ClmmCoder.accounts.decode(
          "tickArray",
          tickArrayAccountInfo.data
        );
        tickArrays.push({
          address: tickArrayAddresses[i]!,
          data: tickArray,
        });
      } else {
        throw new Error("one of the required account is missing");
      }
    }
    this.tickArrays = tickArrays;

    const clmmpool = accountInfoMap.get(this.id);

    if (!clmmpool) {
      throw new Error("one of the required account is missing");
    }
  }

  getQuote(quoteParams: QuoteParams): Quote {
    let outToken: PublicKey;
    let sqrtPriceLimit: u64;
    let aToB, byAmountIn: boolean;

    if (quoteParams.sourceMint.equals(this.reserveTokenMints[0]!)) {
      aToB = true;
    } else {
      aToB = false;
    }

    if (quoteParams.swapMode === "ExactIn") {
      outToken = quoteParams.destinationMint;
      sqrtPriceLimit = new u64(SQRTPRICE_LOWER_X64);
      byAmountIn = true;
    } else {
      outToken = quoteParams.sourceMint;
      sqrtPriceLimit = new u64(SQERPRICE_UPPER_X64);
      byAmountIn = false;
    }

    const swapQuoteParams: SwapQuoteParam = {
      clmmpoolData: this.clmmpoolData,
      tokenAmount: new u64(quoteParams.amount.toString()),
      sqrtPriceLimit,
      amountLimit: new u64("0"),
      aToB,
      byAmountIn,
      tickArrays: this.tickArrays,
    };

    const swapQuote = simulateSwapWithProFeeRate(
      swapQuoteParams,
      this.protocolFeeRate
    );

    const beforePrice = TickMath.sqrtPriceX64ToPrice(
      this.clmmpoolData.currentSqrtPrice,
      this.reserveTokenDecimals[0]!,
      this.reserveTokenDecimals[1]!
    ).toNumber();
    const afterPrice = TickMath.sqrtPriceX64ToPrice(
      swapQuote.estimatedEndSqrtPrice,
      this.reserveTokenDecimals[0]!,
      this.reserveTokenDecimals[1]!
    ).toNumber();

    return {
      notEnoughLiquidity: swapQuote.isExceed,
      inAmount: JSBI.BigInt(swapQuote.estimatedAmountIn),
      outAmount: JSBI.BigInt(swapQuote.estimatedAmountOut),
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
