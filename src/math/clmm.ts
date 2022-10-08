import { BN } from "@project-serum/anchor";

import {
  ClmmpoolsError,
  MathErrorCode,
  TokenErrorCode,
} from "../errors/errors";
import type { ClmmpoolData, TickData } from "../types/clmmpool";
import {
  FEE_RATE_DENOMINATOR,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  ZERO_BN,
} from "../types/constants";
import { MathUtil, ONE, U64_MAX, ZERO } from "./utils";

export type SwapStepResult = {
  amountIn: BN;
  amountOut: BN;
  nextSqrtPrice: BN;
  feeAmount: BN;
};

export type SwapResult = {
  amountIn: BN;
  amountOut: BN;
  feeAmount: BN;
  refAmount: BN;
  nextSqrtPrice: BN;
};

export function getDeltaA(
  sqrtPrice0: BN,
  sqrtPrice1: BN,
  liquidity: BN,
  roundUp: boolean
): BN {
  const sqrtPriceDiff = sqrtPrice0.gt(sqrtPrice1)
    ? sqrtPrice0.sub(sqrtPrice1)
    : sqrtPrice1.sub(sqrtPrice0);
  const numberator = liquidity.mul(sqrtPriceDiff).shln(64);
  const denomminator = sqrtPrice0.mul(sqrtPrice1);
  const quotient = numberator.div(denomminator);
  const remainder = numberator.mod(denomminator);
  const result =
    roundUp && !remainder.eq(ZERO) ? quotient.add(new BN(1)) : quotient;
  if (MathUtil.isOverflow(result, 64)) {
    throw new ClmmpoolsError(
      "Result large than u64 max",
      MathErrorCode.IntegerDowncastOverflow
    );
  }
  return result;
}

export function getDeltaB(
  sqrtPrice0: BN,
  sqrtPrice1: BN,
  liquidity: BN,
  roundUp: boolean
): BN {
  const sqrtPriceDiff = sqrtPrice0.gt(sqrtPrice1)
    ? sqrtPrice0.sub(sqrtPrice1)
    : sqrtPrice1.sub(sqrtPrice0);
  if (liquidity.eq(ZERO) || sqrtPriceDiff.eq(ZERO)) {
    return ZERO;
  }
  const p = liquidity.mul(sqrtPriceDiff);
  const shoudRoundUp = roundUp && p.and(U64_MAX).gt(ZERO);
  const result = shoudRoundUp ? p.shrn(64).add(ONE) : p.shrn(64);
  if (MathUtil.isOverflow(result, 64)) {
    throw new ClmmpoolsError(
      "Result large than u64 max",
      MathErrorCode.IntegerDowncastOverflow
    );
  }
  return result;
}

export function getNextSqrtPriceAUp(
  sqrtPrice: BN,
  liquidity: BN,
  amount: BN,
  byAmountInput: boolean
): BN {
  if (amount.eq(ZERO)) {
    return sqrtPrice;
  }
  const numberator = MathUtil.checkMulShiftLeft(sqrtPrice, liquidity, 64, 256);
  const liquidityShl64 = liquidity.shln(64);
  const product = MathUtil.checkMul(sqrtPrice, amount, 256);
  if (!byAmountInput && liquidityShl64.lte(product)) {
    throw new ClmmpoolsError(
      "getNextSqrtPriceAUp - Unable to divide liquidityShl64 by product",
      MathErrorCode.DivideByZero
    );
  }
  const nextSqrtPrice = byAmountInput
    ? MathUtil.checkDivRoundUpIf(numberator, liquidityShl64.add(product), true)
    : MathUtil.checkDivRoundUpIf(numberator, liquidityShl64.sub(product), true);
  if (nextSqrtPrice.lt(new BN(MIN_SQRT_PRICE))) {
    throw new ClmmpoolsError(
      "getNextSqrtPriceAUp - Next sqrt price less than min sqrt price",
      TokenErrorCode.TokenAmountMinSubceeded
    );
  }
  if (nextSqrtPrice.gt(new BN(MAX_SQRT_PRICE))) {
    throw new ClmmpoolsError(
      "getNextSqrtPriceAUp - Next sqrt price greater than max sqrt price",
      TokenErrorCode.TokenAmountMaxExceeded
    );
  }

  return nextSqrtPrice;
}

export function getNextSqrtPriceBDown(
  sqrtPrice: BN,
  liquidity: BN,
  amount: BN,
  byAmountInput: boolean
): BN {
  const deltaSqrtPrice = MathUtil.checkDivRoundUpIf(
    amount.shln(64),
    liquidity,
    !byAmountInput
  );
  const nextSqrtPrice = byAmountInput
    ? sqrtPrice.add(deltaSqrtPrice)
    : sqrtPrice.sub(deltaSqrtPrice);

  if (
    nextSqrtPrice.lt(new BN(MIN_SQRT_PRICE)) ||
    nextSqrtPrice.gt(new BN(MAX_SQRT_PRICE))
  ) {
    throw new ClmmpoolsError(
      "getNextSqrtPriceAUp - Next sqrt price out of bounds",
      TokenErrorCode.SqrtPriceOutOfBounds
    );
  }

  return nextSqrtPrice;
}

export function getNextSqrtPriceFromInput(
  sqrtPrice: BN,
  liquidity: BN,
  amount: BN,
  aToB: boolean
): BN {
  return aToB
    ? getNextSqrtPriceAUp(sqrtPrice, liquidity, amount, true)
    : getNextSqrtPriceBDown(sqrtPrice, liquidity, amount, true);
}

export function getNextSqrtPriceFromOutput(
  sqrtPrice: BN,
  liquidity: BN,
  amount: BN,
  aToB: boolean
): BN {
  return aToB
    ? getNextSqrtPriceBDown(sqrtPrice, liquidity, amount, false)
    : getNextSqrtPriceAUp(sqrtPrice, liquidity, amount, false);
}

export function getDeltaUpFromInput(
  currentSqrtPrice: BN,
  targetSqrtPrice: BN,
  liquidity: BN,
  aToB: boolean
): BN {
  return aToB
    ? getDeltaA(targetSqrtPrice, currentSqrtPrice, liquidity, true)
    : getDeltaB(currentSqrtPrice, targetSqrtPrice, liquidity, true);
}

export function getDeltaDownFromOutput(
  currentSqrtPrice: BN,
  targetSqrtPrice: BN,
  liquidity: BN,
  aTob: boolean
): BN {
  return aTob
    ? getDeltaB(targetSqrtPrice, currentSqrtPrice, liquidity, false)
    : getDeltaA(currentSqrtPrice, targetSqrtPrice, liquidity, false);
}

export function computeSwapStep(
  currentSqrtPrice: BN,
  targetSqrtPrice: BN,
  liquidity: BN,
  amount: BN,
  feeRate: BN,
  byAmountIn: boolean
): SwapStepResult {
  if (liquidity === ZERO) {
    return {
      amountIn: ZERO_BN,
      amountOut: ZERO_BN,
      nextSqrtPrice: targetSqrtPrice,
      feeAmount: ZERO_BN,
    };
  }

  const aToB = currentSqrtPrice.gte(targetSqrtPrice);
  let amountIn: BN;
  let amountOut: BN;
  let nextSqrtPrice: BN;
  let feeAmount: BN;

  if (byAmountIn) {
    const amountRemain = MathUtil.checkMulDivFloor(
      amount,
      MathUtil.checkUnsignedSub(FEE_RATE_DENOMINATOR, feeRate),
      FEE_RATE_DENOMINATOR,
      64
    );
    const maxAmountIn = getDeltaUpFromInput(
      currentSqrtPrice,
      targetSqrtPrice,
      liquidity,
      aToB
    );
    if (maxAmountIn.gt(amountRemain)) {
      amountIn = amountRemain;
      feeAmount = MathUtil.checkUnsignedSub(amount, amountRemain);
      nextSqrtPrice = getNextSqrtPriceFromInput(
        currentSqrtPrice,
        liquidity,
        amountRemain,
        aToB
      );
    } else {
      amountIn = maxAmountIn;
      feeAmount = MathUtil.checkMulDivCeil(
        amountIn,
        feeRate,
        FEE_RATE_DENOMINATOR.sub(feeRate),
        64
      );
      nextSqrtPrice = targetSqrtPrice;
    }
    amountOut = getDeltaDownFromOutput(
      currentSqrtPrice,
      nextSqrtPrice,
      liquidity,
      aToB
    );
  } else {
    const maxAmountOut = getDeltaDownFromOutput(
      currentSqrtPrice,
      targetSqrtPrice,
      liquidity,
      aToB
    );
    if (maxAmountOut.gt(amount)) {
      amountOut = amount;
      nextSqrtPrice = getNextSqrtPriceFromOutput(
        currentSqrtPrice,
        liquidity,
        amount,
        aToB
      );
    } else {
      amountOut = maxAmountOut;
      nextSqrtPrice = targetSqrtPrice;
    }
    amountIn = getDeltaUpFromInput(
      currentSqrtPrice,
      nextSqrtPrice,
      liquidity,
      aToB
    );
    feeAmount = MathUtil.checkMulDivCeil(
      amountIn,
      feeRate,
      FEE_RATE_DENOMINATOR.sub(feeRate),
      64
    );
  }

  return {
    amountIn,
    amountOut,
    nextSqrtPrice,
    feeAmount,
  };
}

export function swap(
  aToB: boolean,
  byAmountIn: boolean,
  amount: BN,
  poolData: ClmmpoolData,
  swapTicks: Array<TickData>
): SwapResult {
  let remainerAmount = amount;
  let currentLiquidity = poolData.liquidity;
  let currentSqrtPrice = poolData.currentSqrtPrice;

  const swapResult: SwapResult = {
    amountIn: ZERO,
    amountOut: ZERO,
    feeAmount: ZERO,
    refAmount: ZERO,
    nextSqrtPrice: ZERO,
  };

  for (const tick of swapTicks) {
    if (!tick.isInitialized && currentLiquidity.eq(ZERO)) {
      return swapResult;
    }
    const stepResult = computeSwapStep(
      currentSqrtPrice,
      tick.sqrtPrice,
      currentLiquidity,
      remainerAmount,
      new BN(poolData.feeRate),
      byAmountIn
    );
    if (!stepResult.amountIn.eq(ZERO)) {
      remainerAmount = byAmountIn
        ? remainerAmount.sub(stepResult.amountIn.add(stepResult.feeAmount))
        : remainerAmount.sub(stepResult.amountOut);
      swapResult.amountIn = swapResult.amountIn.add(stepResult.amountIn);
      swapResult.amountOut = swapResult.amountOut.add(stepResult.amountOut);
      swapResult.feeAmount = swapResult.feeAmount.add(stepResult.feeAmount);
      swapResult.nextSqrtPrice = stepResult.nextSqrtPrice;
    }
    if (stepResult.nextSqrtPrice.eq(tick.sqrtPrice)) {
      currentLiquidity = aToB
        ? currentLiquidity.add(tick.liquidityNet)
        : currentLiquidity.sub(tick.liquidityNet);
    }
    currentSqrtPrice = stepResult.nextSqrtPrice;

    if (remainerAmount.eq(ZERO)) {
      break;
    }
  }

  return swapResult;
}
