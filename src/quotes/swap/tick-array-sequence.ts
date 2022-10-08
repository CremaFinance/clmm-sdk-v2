import type { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import invariant from "tiny-invariant";

import { ClmmpoolsError, SwapErrorCode } from "../../errors/errors";
import { TickMath } from "../../math/tick";
import type { ClmmpoolData, TickArray, TickData } from "../../types";
import { TICK_ARRAY_SIZE } from "../../types";
import { findNextInitializedTickIndex, TickUtil } from "../../utils";
import { TickArrayIndex } from "./tick-array-index";

/**
 * NOTE: differs from contract method of having the swap manager keep track of array index.
 * This is due to the initial requirement to lazy load tick-arrays. This requirement is no longer necessary.
 */
export class TickArraySequence {
  private touchedArrays: boolean[];
  private startArrayIndex: number;
  private searchIndex: number;
  private searchTickIndex: number;

  constructor(
    readonly tickArrays: TickArray[],
    readonly tickSpacing: number,
    readonly a2b: boolean,
    readonly arrayIndex: number,
    readonly tickIndex: number
  ) {
    console.log(tickArrays, "tickArrays########");
    if (tickArrays[0] && tickArrays[0].data) {
      this.touchedArrays = [...Array<boolean>(tickArrays.length).fill(false)];
      this.startArrayIndex = TickArrayIndex.fromTickIndex(
        tickArrays[0].data.arrayIndex,
        this.tickSpacing
      ).arrayIndex;
      this.searchIndex = arrayIndex;
      this.searchTickIndex = tickIndex;
    } else {
      throw new Error("TickArray index 0 must be initialized");
    }
  }

  checkArrayContainsTickIndex(
    sequenceIndex: number,
    tickIndex: number
  ): boolean {
    const tickArray = this.tickArrays[sequenceIndex]?.data;
    if (!tickArray) {
      return false;
    }
    return this.checkIfIndexIsInTickArrayRange(tickArray.arrayIndex, tickIndex);
  }

  getNumOfTouchedArrays(): number {
    return this.touchedArrays.filter((val) => !!val).length;
  }

  getTouchedArrays(minArraySize: number): PublicKey[] {
    let result = this.touchedArrays.reduce<PublicKey[]>((prev, curr, index) => {
      if (curr) {
        prev.push(this.tickArrays[index]!.address);
      }
      return prev;
    }, []);

    // Edge case: nothing was ever touched.
    if (result.length === 0) {
      return [];
    }

    // The quote object should contain the specified amount of tick arrays to be plugged
    // directly into the swap instruction.
    // If the result does not fit minArraySize, pad the rest with the last touched array
    const sizeDiff = minArraySize - result.length;
    if (sizeDiff > 0) {
      result = result.concat(Array(sizeDiff).fill(result[result.length - 1]));
    }

    return result;
  }

  getTick(index: number): TickData {
    const targetTaIndex = TickArrayIndex.fromTickIndex(index, this.tickSpacing);

    if (!this.isArrayIndexInBounds(targetTaIndex, this.a2b)) {
      throw new Error(
        "Provided tick index is out of bounds for this sequence."
      );
    }

    const localArrayIndex = this.getLocalArrayIndex(
      targetTaIndex.arrayIndex,
      this.a2b
    );
    const tickArray = this.tickArrays[localArrayIndex]!.data;

    this.touchedArrays[localArrayIndex] = true;

    if (!tickArray) {
      throw new ClmmpoolsError(
        `TickArray at index ${localArrayIndex} is not initialized.`,
        SwapErrorCode.TickArrayIndexNotInitialized
      );
    }

    if (!this.checkIfIndexIsInTickArrayRange(tickArray.arrayIndex, index)) {
      throw new ClmmpoolsError(
        `TickArray at index ${localArrayIndex} is unexpected for this sequence.`,
        SwapErrorCode.TickArraySequenceInvalid
      );
    }

    return tickArray.ticks[targetTaIndex.offsetIndex]!;
  }

  private getLocalArrayIndex(arrayIndex: number, aToB: boolean): number {
    return aToB
      ? this.startArrayIndex - arrayIndex
      : arrayIndex - this.startArrayIndex;
  }

  getTickArray(index: number): TickArray {
    if (index < 0 || index >= this.tickArrays.length) {
      throw new Error("The index of tickArrays invalid");
    }
    return this.tickArrays[index]!;
  }

  /**
   * Check whether the array index potentially exists in this sequence.
   * Note: assumes the sequence of tick-arrays are sequential
   * @param index
   */
  private isArrayIndexInBounds(index: TickArrayIndex, aToB: boolean): boolean {
    // a+0...a+n-1 array index is ok
    const localArrayIndex = this.getLocalArrayIndex(index.arrayIndex, aToB);
    const seqLength = this.tickArrays.length;
    return localArrayIndex >= 0 && localArrayIndex < seqLength;
  }

  private checkIfIndexIsInTickArrayRange(
    arrayIndex: number,
    tickIndex: number
  ): boolean {
    const upperBound =
      (arrayIndex + 1) * this.tickSpacing * TICK_ARRAY_SIZE - 443636;
    const lowerBound = arrayIndex * this.tickSpacing * TICK_ARRAY_SIZE - 443636;
    return !(tickIndex < lowerBound || tickIndex > upperBound);
  }

  getNextTickForSwap() {
    while (this.searchIndex < this.tickArrays.length) {
      const tickArray = this.getTickArray(this.searchIndex);
      const nextTickData = findNextInitializedTickIndex(
        this.searchTickIndex,
        this.tickSpacing,
        tickArray,
        this.a2b
      );
      if (nextTickData) {
        if (this.a2b) {
          this.searchTickIndex = nextTickData.nextTickData.index - 1;
        } else {
          this.searchTickIndex = nextTickData.nextTickData.index;
        }
        return nextTickData.nextTickData;
      }

      // Not found next initialized tick
      if (this.searchIndex + 1 === this.tickArrays.length) {
        let endSearchTickIndex;
        if (this.a2b) {
          const startTickIndex = TickUtil.getStartTickIndex(
            tickArray.data!.arrayIndex,
            this.tickSpacing
          );
          if (
            this.searchTickIndex < startTickIndex ||
            TickUtil.isMinTickArray(
              tickArray.data!.arrayIndex,
              this.tickSpacing
            )
          ) {
            return null;
          }

          endSearchTickIndex = TickUtil.getStartTickIndex(
            tickArray.data!.arrayIndex,
            this.tickSpacing
          );
        } else {
          const endTickIndex = TickUtil.getEndTickIndex(
            tickArray.data!.arrayIndex,
            this.tickSpacing
          );

          if (
            this.searchTickIndex >= endTickIndex ||
            TickUtil.isMaxTickArray(
              tickArray.data!.arrayIndex,
              this.tickSpacing
            )
          ) {
            return null;
          }

          endSearchTickIndex = TickUtil.getEndTickIndex(
            tickArray.data!.arrayIndex,
            this.tickSpacing
          );
        }

        const tick: TickData = {
          isInitialized: false,
          index: endSearchTickIndex,
          sqrtPrice: TickMath.tickIndexToSqrtPriceX64(endSearchTickIndex),
          liquidityNet: new BN(0),
          liquidityGross: new BN(0),
          feeGrowthOutsideA: new BN(0),
          feeGrowthOutsideB: new BN(0),
          rewardGrowthOutside: [],
        };

        this.searchTickIndex = endSearchTickIndex;
        return tick;
      }
      this.searchIndex++;
    }
    throw new Error("Next tick not found");
  }

  crossTick(pool: ClmmpoolData, tickIndex: number, aToB: boolean): BN {
    TickUtil.checkIsValidTick(tickIndex, this.tickSpacing);
    invariant(
      TickUtil.isInArray(
        this.tickArrays[this.searchIndex]!.data!.arrayIndex,
        this.tickSpacing,
        tickIndex
      ),
      `tick not in array`
    );

    const offset = TickUtil.getOffset(tickIndex, this.tickSpacing);
    const tickArray = this.tickArrays[this.searchIndex];
    const tick = tickArray?.data?.ticks[offset];
    const currLiquidity = TickUtil.crossUpdate(tick!, pool, aToB);

    return currLiquidity;
  }
}
