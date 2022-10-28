import { ClmmpoolData, TickData } from "@cremafinance/crema-sdk-v2/dist/esm/types/clmmpool";
import { TickArray, TICK_ARRAY_SIZE } from "@cremafinance/crema-sdk-v2/dist/esm/types";
import { computeSwap, PDAUtil, TickMath, TickUtil } from "@cremafinance/crema-sdk-v2";
import type { AccountInfo } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import JSBI from "jsbi";

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
  slippageTolerance: number;
  feeRate: number;
  tickArraysAddr: PublicKey[];
  tickArrays: TickArray[];
  ticks: TickData[];
  private poolAddress: PublicKey;
  private arrayStratIndex: number;

  // address is clmmpool address
  constructor(
    address: PublicKey,
    tickArrayMapInfo: AccountInfo<Buffer>,
    cremaParams: CremaClmmParams
  ) {
    this.label = "Crema";
    this.id = address.toBase58();
    this.poolAddress = address;
    this.ticks = [];
    
    const tickArrayMap = ClmmCoder.accounts.decode(
      "tickArrayMap",
      tickArrayMapInfo.data
    );

    let array_indexs: boolean[] = [];
    for (let index = 0; index < 868; index++) {
      let word: number = tickArrayMap.bitmap[index];
      for (let shift = 0; shift < 8; shift++) {
        if (((word >> shift) & 0x01) > 0) {
          array_indexs.push(true);
        } else {
          array_indexs.push(false);
        }
      }
    }

    for (let i = 0; i < array_indexs.length; i++) {
      if (array_indexs[i]) {
        const tickArrayAddr = PDAUtil.getTickArrayPDA(CREMA_PROGRAM_ID, address, i).publicKey;
        this.tickArraysAddr.push(tickArrayAddr);
      }
    }

    this.reserveTokenDecimals = [cremaParams.decimalA, cremaParams.decimalB];
    this.slippageTolerance = cremaParams.slippageTolerance;
  }

  getAccountsForUpdate(): PublicKey[] {
    return [this.poolAddress, ...this.tickArraysAddr];
  }

  update(accountInfoMap: AccountInfoMap) {
    const clmmpoolInfo = accountInfoMap.get(this.id);
    this.clmmpoolData = ClmmCoder.accounts.decode(
      "clmmpool",
      clmmpoolInfo.data
    );

    if (!this.clmmpoolData) {
      throw new Error("one of the required account is missing");
    }
    this.feeRate = this.clmmpoolData.feeRate;
    this.reserveTokenMints = [
      this.clmmpoolData.tokenA,
      this.clmmpoolData.tokenB,
    ];
    const arrayIndex = TickUtil.getArrayIndex(this.clmmpoolData.currentTickIndex, this.clmmpoolData.tickSpacing);

    let find = false;
    // decode all initialized tick arrays.
    const tickArrays: TickArray[] = [];

    for (let i = 0; i < this.tickArraysAddr.length; i++) {
      const tickArrayInfo = accountInfoMap.get(
        this.tickArraysAddr[i]!.toBase58()
      );
      if (tickArrayInfo) {
        const tickArray = ClmmCoder.accounts.decode(
          "tickArray",
          tickArrayInfo.data
        );
        if(find === false && tickArray.index >= arrayIndex) {
          find = true;
          this.arrayStratIndex = i;
        }
        tickArrays.push({
          address: this.tickArraysAddr[i]!,
          data: tickArray,
        });
      } else {
        throw new Error("one of the required account is missing");
      }
    }

    this.tickArrays = tickArrays;
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

    let swapTickArrays: TickArray[] = [];
    if (aToB) {
      for (let i = this.arrayStratIndex; i > this.arrayStratIndex - 3; i--) {
        swapTickArrays.push(this.tickArrays[i]);
      }
    } else {
      for (let i = this.arrayStratIndex; i < this.arrayStratIndex + 3; i++) {
        swapTickArrays.push(this.tickArrays[i]);
      }
    }

    for (let i = 0; i < swapTickArrays.length; i++) {
      const tickArray: any = swapTickArrays[i];
      if (aToB) {
        for (let j = TICK_ARRAY_SIZE - 1; j >= 0; j--) {
          if (tickArray.data.ticks[j].isInitialized) {
            this.ticks.push(tickArray.data.ticks[j]);
          }
        }
      } else {
        for (let j = 0; j < TICK_ARRAY_SIZE; j++) {
          if (tickArray.data.ticks[j].isInitialized) {
            this.ticks.push(tickArray.data.ticks[j]);
          }
        }
      }
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
