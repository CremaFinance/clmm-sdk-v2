import type { Provider } from "@cremafinance/solana-contrib";
import { getTokenAccount } from "@cremafinance/token-utils";
import type { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import invariant from "tiny-invariant";

import type { ClmmpoolContext } from "../context";
import { ZERO } from "../math/utils";
import type { AccountFetcher } from "../network";
import { TickArrayIndex } from "../quotes";
import type { TickArray } from "../types";
import type {
  ClmmpoolData,
  TickArrayData,
  TickArrayMapData,
  TickData,
} from "../types/clmmpool";
import {
  MAX_TICK_INDEX,
  MIN_TICK_INDEX,
  TICK_ARRAY_MAP_MAX_BIT_INDEX,
  TICK_ARRAY_MAP_MIN_BIT_INDEX,
  TICK_ARRAY_SIZE,
} from "../types/constants";
import { PDAUtil } from "./pda";

enum TickSearchDirection {
  Left,
  Right,
}

/**
 * A collection of utility functions when interacting with a Tick.
 * There are some functions already initialized in tick math.
 * @category Tick Utils
 */
export class TickUtil {
  /**
   * Get the previous initialized tick index within the same tick array.
   *
   * @param account
   * @param currentTickIndex
   * @param tickSpacing
   * @returns
   */
  static findPreviousInitializedTickIndex(
    account: TickArrayData,
    currentTickIndex: number,
    tickSpacing: number
  ): number | null {
    return TickUtil.findInitializedTick(
      account,
      currentTickIndex,
      tickSpacing,
      TickSearchDirection.Left
    );
  }

  static isTickInitializable(tick: number, tickSpacing: number) {
    return tick % tickSpacing === 0;
  }

  /**
   * Get the next(right) initialized tick index within the same tick array.
   * @param account
   * @param currentTickIndex
   * @param tickSpacing
   * @returns
   */
  static findNextInitializedTickIndex(
    account: TickArrayData,
    currentTickIndex: number,
    tickSpacing: number
  ): number | null {
    return TickUtil.findInitializedTick(
      account,
      currentTickIndex,
      tickSpacing,
      TickSearchDirection.Right
    );
  }

  /**
   * Get the initialized tick.
   *
   * @param account
   * @param currentTickIndex
   * @param tickSpacing
   * @param direction
   * @returns
   */
  private static findInitializedTick(
    account: TickArrayData,
    currentTickIndex: number,
    tickSpacing: number,
    direction: TickSearchDirection
  ): number | null {
    const currentTickArrayIndex = tickIndexToInnerIndex(
      account.arrayIndex,
      currentTickIndex,
      tickSpacing
    );

    const increment = direction === TickSearchDirection.Right ? 1 : -1;

    let stepInitializedTickArrayIndex =
      direction === TickSearchDirection.Right
        ? currentTickArrayIndex + increment
        : currentTickArrayIndex;
    while (
      stepInitializedTickArrayIndex >= 0 &&
      stepInitializedTickArrayIndex < account.ticks.length
    ) {
      if (account.ticks[stepInitializedTickArrayIndex]?.isInitialized) {
        return innerIndexToTickIndex(
          account.arrayIndex,
          stepInitializedTickArrayIndex,
          tickSpacing
        );
      }

      stepInitializedTickArrayIndex += increment;
    }

    return null;
  }

  /**
   * check if the tick is in bounds
   * @param tick - tick index
   *
   * @retruns true or false
   */
  static checkTickInBounds(tick: number) {
    return tick <= MAX_TICK_INDEX && tick >= MIN_TICK_INDEX;
  }

  /**
   * check if the tick is valid
   * @param tick_index - tick index
   * @param tick_spacing - tick spacing
   *
   * @retruns true or false
   */
  static checkIsValidTick(tick_index: number, tick_spacing: number) {
    const min = this.getMinIndex(tick_spacing);
    const max = this.getMaxIndex(tick_spacing);
    invariant(tick_index >= min && tick_index <= max, `tick index invalid`);
    invariant(tick_index % tick_spacing === 0, `tick index invalid`);
  }

  /**
   * get min tick index
   * @param tick_spacing - tick spacing
   *
   * @retruns min tick index
   */
  static getMinIndex(tick_spacing: number) {
    return MIN_TICK_INDEX + (Math.abs(MIN_TICK_INDEX) % tick_spacing);
  }

  /**
   * get max tick index
   * @param tick_spacing - tick spacing
   *
   * @retruns max tick index
   */
  static getMaxIndex(tick_spacing: number) {
    return MAX_TICK_INDEX - (MAX_TICK_INDEX % tick_spacing);
  }

  /**
   * get array index
   * @param tickIndex - tick index
   * @param tick_spacing - tick spacing
   *
   * @retruns max tick index
   */
  static getArrayIndex(tick_index: number, tick_spacing: number): number {
    const min = this.getMinIndex(tick_spacing);
    const max = this.getMaxIndex(tick_spacing);

    invariant(tick_index >= min && tick_index <= max, `tick index invalid`);

    const array_spacing = TICK_ARRAY_SIZE * tick_spacing;
    return Math.floor((tick_index - min) / array_spacing);
  }

  /**
   * get offset index
   * @param tickIndex - tick index
   * @param tick_spacing - tick spacing
   *
   * @retruns offset index
   */
  static getOffset(tick_index: number, tick_spacing: number): number {
    const array_index = this.getArrayIndex(tick_index, tick_spacing);
    const start_index = this.getStartTickIndex(array_index, tick_spacing);
    return Math.floor((tick_index - start_index) / tick_spacing);
  }

  /**
   * get start tick index
   * @param tickIndex - tick index
   * @param tick_spacing - tick spacing
   *
   * @retruns start tick index
   */
  static getStartTickIndex(array_index: number, tick_spacing: number): number {
    const min = this.getMinIndex(tick_spacing);
    const array_spacing = TICK_ARRAY_SIZE * tick_spacing;
    return min + array_spacing * array_index;
  }

  /**
   * get end tick index
   * @param tickIndex - tick index
   * @param tick_spacing - tick spacing
   *
   * @retruns end tick index
   */
  static getEndTickIndex(array_index: number, tick_spacing: number): number {
    const start_index = this.getStartTickIndex(array_index, tick_spacing);
    return start_index + (TICK_ARRAY_SIZE - 1) * tick_spacing;
  }

  /**
   * Verify if the tickArray is min
   * @param arrayIndex - array index
   * @param tick_spacing - tick spacing
   *
   * @retruns true or false
   */
  static isMinTickArray(array_index: number, tick_spacing: number): boolean {
    return (
      this.getStartTickIndex(array_index, tick_spacing) ===
      this.getMinIndex(tick_spacing)
    );
  }

  /**
   * Verify if the tickArray is max
   * @param arrayIndex - array index
   * @param tick_spacing - tick spacing
   *
   * @retruns true or false
   */
  static isMaxTickArray(array_index: number, tick_spacing: number): boolean {
    return (
      this.getEndTickIndex(array_index, tick_spacing) ===
      this.getMaxIndex(tick_spacing)
    );
  }

  /**
   * Verify if the tick is in tickArray
   * @param array_index - array index
   * @param tick_spacing - tick spacing
   * @param tick_index - tick index
   *
   * @retruns true or false
   */
  static isInArray(
    array_index: number,
    tick_spacing: number,
    tick_index: number
  ) {
    return (
      tick_index >= this.getStartTickIndex(array_index, tick_spacing) &&
      tick_index <= this.getEndTickIndex(array_index, tick_spacing)
    );
  }

  /**
   * Cross update
   * @param tick - index data
   * @param pool - clmm pool address
   * @param aToB - swap direcation
   *
   * @retruns true or false
   */
  static crossUpdate(tick: TickData, pool: ClmmpoolData, aToB: boolean) {
    const liquidity = pool.liquidity;
    const signedLiquidityChange = aToB
      ? tick.liquidityNet.mul(new BN(-1))
      : tick.liquidityNet;
    const currentLiquidity = signedLiquidityChange.gt(ZERO)
      ? liquidity.add(signedLiquidityChange)
      : liquidity.sub(signedLiquidityChange.abs());

    return currentLiquidity;
  }

  /**
   * Get tick data from tick index
   * @param fetcher - solana fetcher
   * @param clmmpool - clmm pool address
   * @param programId - SPL Token program account
   * @param tick_index - tick index
   * @param tick_spacing - tick spacing
   *
   * @retruns tick data
   */
  static async getTickDataFromIndex(
    fetcher: AccountFetcher,
    clmmpool: PublicKey,
    programId: PublicKey,
    tick_index: number,
    tick_spacing: number
  ): Promise<TickData> {
    const arrayIndex = this.getArrayIndex(tick_index, tick_spacing);
    const offset = this.getOffset(tick_index, tick_spacing);
    const tickArrayAddress = PDAUtil.getTickArrayPDA(
      programId,
      clmmpool,
      arrayIndex
    ).publicKey;
    const tickArray = await fetcher.getTickArray(tickArrayAddress, true);

    const tickData = tickArray!.ticks[offset];
    return tickData!;
  }
}

/**
 * Get the inner index.
 * @param start_tick_index - start tick index
 * @param tick_array_index - tick array index
 * @param tickSpacing - tick spacing
 *
 * @retruns inner index
 */
function innerIndexToTickIndex(
  start_tick_index: number,
  tick_array_index: number,
  tickSpacing: number
): number {
  return start_tick_index + tick_array_index * tickSpacing;
}

/**
 * A collection of utility functions when interacting with a TickArray.
 * @category TickArray Utils
 */
export class TickArrayUtil {
  /**
   * Evaluate a list of tick-array data and return the array of indices which the tick-arrays are not initialized.
   * @param tickArrays - a list of TickArrayData or null objects from AccountFetcher.listTickArrays
   * @returns an array of array-index for the input tickArrays that requires initialization.
   */
  static getUninitializedArrays(
    tickArrays: (TickArrayData | null)[]
  ): number[] {
    return tickArrays
      .map((value, index) => {
        if (!value) {
          return index;
        }
        return -1;
      })
      .filter((index) => index >= 0);
  }

  /**
   * Verify if tickArray initialized
   * @param address - tick array address
   * @param provider - solana provider
   *
   * @returns true of false
   */
  static async isTickArrayInitialized(
    address: PublicKey,
    provider: Provider
  ): Promise<boolean> {
    try {
      await getTokenAccount(provider, address);
    } catch {
      return false;
    }

    return true;
  }
}

/**
 * Transfer tick index to inner index
 * @param start_tick_index - start tick index
 * @param tick_index - tick index
 * @param tick_spacing - tick spacing
 *
 * @returns inner index
 */
function tickIndexToInnerIndex(
  start_tick_index: number,
  tick_index: number,
  tick_spacing: number
): number {
  return Math.floor((tick_index - start_tick_index) / tick_spacing);
}

/**
 * Search range
 * @param array_index - start tick index
 * @param tick_index - tick index
 * @param tick_spacing - tick spacing
 * @param a2B - swap direction
 *
 * @returns start and end index
 */
function searchRange(
  array_index: number,
  tick_index: number,
  tick_spacing: number,
  a2B: boolean
) {
  if (a2B) {
    if (tick_index < TickUtil.getStartTickIndex(array_index, tick_spacing)) {
      return null;
    }

    let end: number;
    const endIndex = TickUtil.getEndTickIndex(array_index, tick_spacing);
    if (tick_index >= endIndex) {
      end = TICK_ARRAY_SIZE - 1;
    } else {
      end = TickUtil.getOffset(tick_index, tick_spacing);
    }
    return { start: 0, end };
  }

  if (tick_index > TickUtil.getEndTickIndex(array_index, tick_spacing)) {
    return null;
  }
  let start: number;
  const startIndex = TickUtil.getStartTickIndex(array_index, tick_spacing);
  if (tick_index < startIndex) {
    start = 0;
  } else {
    start = TickUtil.getOffset(tick_index, tick_spacing) + 1;
  }
  return { start, end: TICK_ARRAY_SIZE - 1 };
}

/**
 * Get next initialized tick index
 * if a->b, currIndex is included in the search
 * if b->a, currIndex is always ignored
 * @param curr_index
 * @param tick_spacing
 * @param tick_array
 * @param a2B
 *
 * @returns
 */
export function findNextInitializedTickIndex(
  curr_index: number,
  tick_spacing: number,
  tick_array: TickArray,
  a2B: boolean
) {
  const arrayIndex = TickArrayIndex.fromTickIndex(curr_index, tick_spacing);
  const searchRanges = searchRange(
    arrayIndex.arrayIndex,
    curr_index,
    tick_spacing,
    a2B
  );
  if (!searchRanges) {
    return null;
  }

  if (a2B) {
    for (let i = searchRanges.start; i <= searchRanges.end; i++) {
      const t = tick_array.data!.ticks[i];
      if (t && t.isInitialized) {
        return { nextTickData: t };
      }
    }
    return null;
  } else {
    for (let i = searchRanges.end; i >= searchRanges.start; i--) {
      const t = tick_array.data!.ticks[i];
      if (t && t.isInitialized) {
        return { nextTickData: t };
      }
    }
  }
}

/**
 * Get all ticks
 * @param ctx
 * @param programId
 * @param tick_spacing
 * @param clmmpool
 *
 * @returns all ticks
 */
export async function getAllTicks(
  ctx: ClmmpoolContext,
  programId: PublicKey,
  tick_spacing: number,
  clmmpool: PublicKey
): Promise<TickData[]> {
  const maxIndex = TickUtil.getMaxIndex(tick_spacing);
  const maxTickArrayIndex = TickUtil.getArrayIndex(maxIndex, tick_spacing);
  const tickArrayMapAddress = PDAUtil.getTickArrayMapPDA(
    programId,
    clmmpool
  ).publicKey;

  await ctx.fetcher.refreshAll();
  const map = await ctx.fetcher.getTickArrayMap(tickArrayMapAddress);

  const tickArrayAddresses = [];
  for (let i = 0; i < maxTickArrayIndex; i++) {
    if (map?.bitmap[i] && map?.bitmap[i] !== 0) {
      for (let j = 0; j < 8; j++) {
        if ((map.bitmap[i]! & (1 << j)) !== 0) {
          const tickArrayAddress = PDAUtil.getTickArrayPDA(
            programId,
            clmmpool,
            i * 8 + j
          ).publicKey;
          tickArrayAddresses.push(tickArrayAddress);
        }
      }
    }
  }

  const ticks: TickData[] = [];
  for (let i = 0; i < tickArrayAddresses.length; i++) {
    const arrayAddress = tickArrayAddresses[i];
    if (arrayAddress) {
      await ctx.fetcher.refreshAll();
      const ticksInArray = await ctx.fetcher.getTickArray(arrayAddress);
      if (ticksInArray) {
        for (let j = 0; j < ticksInArray.ticks.length; j++) {
          const tick = ticksInArray.ticks[j];
          if (tick) {
            ticks.push(tick);
          }
        }
      }
    }
  }

  return ticks;
}

/**
 * Get all ticks price
 * @param ticks
 *
 * @returns ticks price
 */
export async function getTicksPrice(ticks: TickData[]) {
  const prices = [];
  for (let i = 0; i < ticks.length; i++) {
    const tick = ticks[i];
    if (!tick!.isInitialized) {
      throw new Error(`tick ${i} is not initialized`);
    }
    prices.push(tick!.sqrtPrice.mul(tick!.sqrtPrice));
  }
  return prices;
}

export function getNearestTickByCurrentTick(
  tickIndex: number,
  tickSpacing: number
) {
  const mod = Math.abs(tickIndex) % tickSpacing;
  if (tickIndex > 0) {
    if (mod > tickSpacing / 2) {
      return tickIndex + tickSpacing - mod;
    } else {
      return tickIndex - mod;
    }
  } else {
    if (mod > tickSpacing / 2) {
      return tickIndex - tickSpacing + mod;
    } else {
      return tickIndex + mod;
    }
  }
}

/**
 * Create tick array range
 * @param ctx
 * @param clmmpool
 * @param array_index
 * @param array_count
 * @parma a2b
 *
 * @returns ticks price
 */
export async function createTickArrayRange(
  ctx: ClmmpoolContext,
  programId: PublicKey,
  clmmpool: PublicKey,
  array_index: number,
  array_count: number,
  a2b: boolean
): Promise<PublicKey[]> {
  const tickArrayMapAddr = PDAUtil.getTickArrayMapPDA(
    programId,
    clmmpool
  ).publicKey;
  const tickArrayMap = await ctx.fetcher.getTickArrayMap(tickArrayMapAddr);

  const tickArrays: PublicKey[] = [];
  const tickArray_0 = PDAUtil.getTickArrayPDA(programId, clmmpool, array_index);
  tickArrays.push(tickArray_0.publicKey);
  array_count -= 1;

  while (array_count > 0 && tickArrayMap !== null) {
    const index = getNextSetedTickArray(tickArrayMap, array_index, a2b);
    if (index !== null) {
      const tickArray_i = PDAUtil.getTickArrayPDA(programId, clmmpool, index);
      tickArrays.push(tickArray_i.publicKey);
      array_count -= 1;
    } else {
      break;
    }
  }

  return tickArrays;
}

export function getNextSetedTickArray(
  tickArrayMap: TickArrayMapData,
  bit: number,
  shl: boolean
) {
  invariant(
    bit < TICK_ARRAY_MAP_MAX_BIT_INDEX && bit >= TICK_ARRAY_MAP_MIN_BIT_INDEX,
    "Invalid tick array bit"
  );

  const wordIndex = bit / 8;
  if (shl) {
    let shift = bit % 8;
    for (let index = wordIndex; index >= 0; index--) {
      const word = tickArrayMap.bitmap[index]!;
      if (word === 0) {
        shift = 8;
        continue;
      }
      while (shift > 0) {
        if (((word << (8 - shift)) & 0x80) > 0) {
          return index * 8 + shift - 1;
        }
        shift -= 1;
      }
      shift = 8;
    }
    return null;
  } else {
    let shift = (bit % 8) + 1;
    for (let index = wordIndex; index < 868; index++) {
      const world = tickArrayMap.bitmap[index]!;
      if (world === 0) {
        shift = 0;
        continue;
      }
      while (shift < 0) {
        if (((world >> shift) & 0x01) > 0) {
          return index * 8 + shift;
        }
        shift += 1;
      }
      shift = 0;
    }
    return null;
  }
}
