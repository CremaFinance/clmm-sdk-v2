import { BN } from "@project-serum/anchor";
import Decimal from "../utils/decimal";
import invariant from "tiny-invariant";

import {
  MAX_SQRT_PRICE,
  MAX_TICK_INDEX,
  MIN_SQRT_PRICE,
  MIN_TICK_INDEX,
  TICK_ARRAY_SIZE,
} from "../types/constants";
import { MathUtil } from "./utils";

const BIT_PRECISION = 14;
const LOG_B_2_X32 = "59543866431248";
const LOG_B_P_ERR_MARGIN_LOWER_X64 = "184467440737095516";
const LOG_B_P_ERR_MARGIN_UPPER_X64 = "15793534762490258745";

/**
 * TickMath - the math util set of tick.
 */
export class TickMath {
  static priceToSqrtPriceX64(
    price: Decimal,
    decimalsA: number,
    decimalsB: number
  ): BN {
    return MathUtil.toX64(
      price.mul(Decimal.pow(10, decimalsB - decimalsA)).sqrt()
    );
  }

  static sqrtPriceX64ToPrice(
    sqrtPriceX64: BN,
    decimalsA: number,
    decimalsB: number
  ): Decimal {
    return MathUtil.fromX64(sqrtPriceX64)
      .pow(2)
      .mul(Decimal.pow(10, decimalsA - decimalsB));
  }

  /**
   * @param tickIndex
   * @returns
   */
  static tickIndexToSqrtPriceX64(tickIndex: number): BN {
    if (tickIndex > 0) {
      return new BN(tickIndexToSqrtPricePositive(tickIndex));
    } else {
      return new BN(tickIndexToSqrtPriceNegative(tickIndex));
    }
  }

  /**
   *
   * @param sqrtPriceX64
   * @returns
   */
  static sqrtPriceX64ToTickIndex(sqrtPriceX64: BN): number {
    if (
      sqrtPriceX64.gt(new BN(MAX_SQRT_PRICE)) ||
      sqrtPriceX64.lt(new BN(MIN_SQRT_PRICE))
    ) {
      throw new Error(
        "Provided sqrtPrice is not within the supported sqrtPrice range."
      );
    }

    const msb = sqrtPriceX64.bitLength() - 1;
    const adjustedMsb = new BN(msb - 64);
    const log2pIntegerX32 = signedShiftLeft(adjustedMsb, 32, 128);

    let bit = new BN("8000000000000000", "hex");
    let precision = 0;
    let log2pFractionX64 = new BN(0);

    let r =
      msb >= 64 ? sqrtPriceX64.shrn(msb - 63) : sqrtPriceX64.shln(63 - msb);

    while (bit.gt(new BN(0)) && precision < BIT_PRECISION) {
      r = r.mul(r);
      const rMoreThanTwo = r.shrn(127);
      r = r.shrn(63 + rMoreThanTwo.toNumber());
      log2pFractionX64 = log2pFractionX64.add(bit.mul(rMoreThanTwo));
      bit = bit.shrn(1);
      precision += 1;
    }

    const log2pFractionX32 = log2pFractionX64.shrn(32);

    const log2pX32 = log2pIntegerX32.add(log2pFractionX32);
    const logbpX64 = log2pX32.mul(new BN(LOG_B_2_X32));

    const tickLow = signedShiftRight(
      logbpX64.sub(new BN(LOG_B_P_ERR_MARGIN_LOWER_X64)),
      64,
      128
    ).toNumber();
    const tickHigh = signedShiftRight(
      logbpX64.add(new BN(LOG_B_P_ERR_MARGIN_UPPER_X64)),
      64,
      128
    ).toNumber();

    if (tickLow === tickHigh) {
      return tickLow;
    } else {
      const derivedTickHighSqrtPriceX64 =
        TickMath.tickIndexToSqrtPriceX64(tickHigh);
      if (derivedTickHighSqrtPriceX64.lte(sqrtPriceX64)) {
        return tickHigh;
      } else {
        return tickLow;
      }
    }
  }

  static tickIndexToPrice(
    tickIndex: number,
    decimalsA: number,
    decimalsB: number
  ): Decimal {
    return TickMath.sqrtPriceX64ToPrice(
      TickMath.tickIndexToSqrtPriceX64(tickIndex),
      decimalsA,
      decimalsB
    );
  }

  static priceToTickIndex(
    price: Decimal,
    decimalsA: number,
    decimalsB: number
  ): number {
    return TickMath.sqrtPriceX64ToTickIndex(
      TickMath.priceToSqrtPriceX64(price, decimalsA, decimalsB)
    );
  }

  static priceToInitializableTickIndex(
    price: Decimal,
    decimalsA: number,
    decimalsB: number,
    tickSpacing: number
  ): number {
    return TickMath.getInitializableTickIndex(
      TickMath.priceToTickIndex(price, decimalsA, decimalsB),
      tickSpacing
    );
  }

  static getStartTickIndex(
    tickIndex: number,
    tickSpacing: number,
    offset = 0
  ): number {
    const realIndex = Math.floor(tickIndex / tickSpacing / TICK_ARRAY_SIZE);
    const startTickIndex = (realIndex + offset) * tickSpacing * TICK_ARRAY_SIZE;

    const ticksInArray = TICK_ARRAY_SIZE * tickSpacing;
    const minTickIndex =
      MIN_TICK_INDEX - ((MIN_TICK_INDEX % ticksInArray) + ticksInArray);
    invariant(
      startTickIndex >= minTickIndex,
      `startTickIndex is too small - - ${startTickIndex}`
    );
    invariant(
      startTickIndex <= MAX_TICK_INDEX,
      `startTickIndex is too large - ${startTickIndex}`
    );
    return startTickIndex;
  }

  static getInitializableTickIndex(
    tickIndex: number,
    tickSpacing: number
  ): number {
    return tickIndex - (tickIndex % tickSpacing);
  }

  static getNextInitializableTickIndex(tickIndex: number, tickSpacing: number) {
    return (
      TickMath.getInitializableTickIndex(tickIndex, tickSpacing) + tickSpacing
    );
  }

  static getPrevInitializableTickIndex(tickIndex: number, tickSpacing: number) {
    return (
      TickMath.getInitializableTickIndex(tickIndex, tickSpacing) - tickSpacing
    );
  }
}

function tickIndexToSqrtPricePositive(tick: number) {
  let ratio: BN;

  if ((tick & 1) !== 0) {
    ratio = new BN("79232123823359799118286999567");
  } else {
    ratio = new BN("79228162514264337593543950336");
  }

  if ((tick & 2) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79236085330515764027303304731")),
      96,
      256
    );
  }
  if ((tick & 4) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79244008939048815603706035061")),
      96,
      256
    );
  }
  if ((tick & 8) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79259858533276714757314932305")),
      96,
      256
    );
  }
  if ((tick & 16) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79291567232598584799939703904")),
      96,
      256
    );
  }
  if ((tick & 32) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79355022692464371645785046466")),
      96,
      256
    );
  }
  if ((tick & 64) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79482085999252804386437311141")),
      96,
      256
    );
  }
  if ((tick & 128) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79736823300114093921829183326")),
      96,
      256
    );
  }
  if ((tick & 256) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("80248749790819932309965073892")),
      96,
      256
    );
  }
  if ((tick & 512) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("81282483887344747381513967011")),
      96,
      256
    );
  }
  if ((tick & 1024) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("83390072131320151908154831281")),
      96,
      256
    );
  }
  if ((tick & 2048) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("87770609709833776024991924138")),
      96,
      256
    );
  }
  if ((tick & 4096) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("97234110755111693312479820773")),
      96,
      256
    );
  }
  if ((tick & 8192) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("119332217159966728226237229890")),
      96,
      256
    );
  }
  if ((tick & 16384) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("179736315981702064433883588727")),
      96,
      256
    );
  }
  if ((tick & 32768) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("407748233172238350107850275304")),
      96,
      256
    );
  }
  if ((tick & 65536) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("2098478828474011932436660412517")),
      96,
      256
    );
  }
  if ((tick & 131072) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("55581415166113811149459800483533")),
      96,
      256
    );
  }
  if ((tick & 262144) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("38992368544603139932233054999993551")),
      96,
      256
    );
  }

  return signedShiftRight(ratio, 32, 256);
}

function tickIndexToSqrtPriceNegative(tickIndex: number) {
  const tick = Math.abs(tickIndex);
  let ratio: BN;

  if ((tick & 1) !== 0) {
    ratio = new BN("18445821805675392311");
  } else {
    ratio = new BN("18446744073709551616");
  }

  if ((tick & 2) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18444899583751176498")),
      64,
      256
    );
  }
  if ((tick & 4) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18443055278223354162")),
      64,
      256
    );
  }
  if ((tick & 8) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18439367220385604838")),
      64,
      256
    );
  }
  if ((tick & 16) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18431993317065449817")),
      64,
      256
    );
  }
  if ((tick & 32) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18417254355718160513")),
      64,
      256
    );
  }
  if ((tick & 64) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18387811781193591352")),
      64,
      256
    );
  }
  if ((tick & 128) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18329067761203520168")),
      64,
      256
    );
  }
  if ((tick & 256) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18212142134806087854")),
      64,
      256
    );
  }
  if ((tick & 512) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("17980523815641551639")),
      64,
      256
    );
  }
  if ((tick & 1024) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("17526086738831147013")),
      64,
      256
    );
  }
  if ((tick & 2048) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("16651378430235024244")),
      64,
      256
    );
  }
  if ((tick & 4096) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("15030750278693429944")),
      64,
      256
    );
  }
  if ((tick & 8192) !== 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("12247334978882834399")),
      64,
      256
    );
  }
  if ((tick & 16384) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN("8131365268884726200")), 64, 256);
  }
  if ((tick & 32768) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN("3584323654723342297")), 64, 256);
  }
  if ((tick & 65536) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN("696457651847595233")), 64, 256);
  }
  if ((tick & 131072) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN("26294789957452057")), 64, 256);
  }
  if ((tick & 262144) !== 0) {
    ratio = signedShiftRight(ratio.mul(new BN("37481735321082")), 64, 256);
  }

  return ratio;
}

function signedShiftLeft(n0: BN, shiftBy: number, bitWidth: number) {
  const twosN0 = n0.toTwos(bitWidth).shln(shiftBy);
  twosN0.imaskn(bitWidth + 1);
  return twosN0.fromTwos(bitWidth);
}

function signedShiftRight(n0: BN, shiftBy: number, bitWidth: number) {
  const twoN0 = n0.toTwos(bitWidth).shrn(shiftBy);
  twoN0.imaskn(bitWidth - shiftBy + 1);
  return twoN0.fromTwos(bitWidth - shiftBy);
}
