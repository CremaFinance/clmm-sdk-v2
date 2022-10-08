import type { u64 } from "@solana/spl-token";
import BN from "bn.js";

import type { SwapResult, SwapStepResult } from "../../math/clmm";
import { computeSwapStep } from "../../math/clmm";
import { TickMath } from "../../math/tick";
import { MathUtil, ZERO } from "../../math/utils";
import type { ClmmpoolData } from "../../types";
import { ClmmPoolUtil } from "../../utils";
import type { TickArraySequence } from "./tick-array-sequence";

function updateSwapResult(swapResult: SwapResult, stepResult: SwapStepResult) {
  const newSwapResult: SwapResult = {
    amountIn: new BN(0),
    amountOut: new BN(0),
    feeAmount: new BN(0),
    refAmount: new BN(0),
    nextSqrtPrice: new BN(0),
  };

  Object.assign(swapResult, newSwapResult);
  newSwapResult.amountIn = swapResult.amountIn.add(stepResult.amountIn);
  newSwapResult.amountOut = swapResult.amountOut.add(stepResult.amountOut);
  newSwapResult.feeAmount = swapResult.feeAmount.add(stepResult.feeAmount);
  return newSwapResult;
}

export function computeSwap(
  clmmpoolData: ClmmpoolData,
  tickSequence: TickArraySequence,
  amount: u64,
  sqrtPriceLimit: BN,
  byAmountIn: boolean,
  refRate: number,
  protocolFeeRate: number,
  aToB: boolean
): SwapResult {
  let remainingAmount = amount;
  let swapResult: SwapResult = {
    amountIn: ZERO,
    amountOut: ZERO,
    feeAmount: ZERO,
    refAmount: ZERO,
    nextSqrtPrice: ZERO,
  };

  const currSqrtPrice = clmmpoolData.currentSqrtPrice;
  const currLiquidity = clmmpoolData.liquidity;
  const feeRate = new BN(clmmpoolData.feeRate);

  while (remainingAmount.gt(ZERO) && !sqrtPriceLimit.eq(currSqrtPrice)) {
    const nextTick = tickSequence.getNextTickForSwap();
    if (nextTick === null) {
      return swapResult;
    }
    if (!nextTick.isInitialized && clmmpoolData.liquidity === new BN(0)) {
      return swapResult;
    }

    let targetSqrtPrice;
    if (
      (aToB && sqrtPriceLimit.gt(nextTick.sqrtPrice)) ||
      (!aToB && sqrtPriceLimit.lt(nextTick.sqrtPrice))
    ) {
      targetSqrtPrice = sqrtPriceLimit;
    } else {
      targetSqrtPrice = nextTick.sqrtPrice;
    }

    const stepResult = computeSwapStep(
      currSqrtPrice,
      targetSqrtPrice,
      currLiquidity,
      remainingAmount,
      feeRate,
      byAmountIn
    );

    if (stepResult.amountIn !== ZERO) {
      if (byAmountIn) {
        remainingAmount = MathUtil.checkUnsignedSub(
          remainingAmount,
          stepResult.amountIn
        );
        remainingAmount = MathUtil.checkUnsignedSub(
          remainingAmount,
          stepResult.feeAmount
        );
      } else {
        remainingAmount = MathUtil.checkUnsignedSub(
          remainingAmount,
          stepResult.amountOut
        );
      }
    }

    swapResult = updateSwapResult(swapResult, stepResult);

    const { refFee, clmm } = ClmmPoolUtil.updateFeeRate(
      clmmpoolData,
      stepResult.feeAmount,
      refRate,
      protocolFeeRate,
      aToB
    );
    clmmpoolData = clmm;
    swapResult.refAmount = refFee;

    if (
      nextTick?.isInitialized &&
      stepResult.nextSqrtPrice === nextTick.sqrtPrice
    ) {
      clmm.currentSqrtPrice = nextTick.sqrtPrice;
      clmm.currentTickIndex = aToB ? nextTick.index : nextTick.index - 1;
      clmm.liquidity = tickSequence.crossTick(clmm, nextTick.index, aToB);
    } else {
      clmm.currentSqrtPrice = stepResult.nextSqrtPrice;
      clmm.currentTickIndex = TickMath.sqrtPriceX64ToTickIndex(
        clmm.currentSqrtPrice
      );
    }
  }

  swapResult.amountIn = swapResult.amountIn.add(swapResult.feeAmount);
  swapResult.nextSqrtPrice = clmmpoolData.currentSqrtPrice;

  return swapResult;
}
