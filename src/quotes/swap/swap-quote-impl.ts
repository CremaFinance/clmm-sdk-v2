import { BN } from "@project-serum/anchor";

import { ClmmpoolsError, SwapErrorCode } from "../../errors/errors";
import { ZERO } from "../../math/utils";
import { MAX_SQRT_PRICE, MAX_TICK_ARRAY, MIN_SQRT_PRICE } from "../../types";
import { getTokenBalance } from "../../utils/token";
import type { SwapQuote, SwapQuoteParam } from "../public/swap";
import { computeSwap } from "./swap-manager";
import { TickArraySequence } from "./tick-array-sequence";

/**
 * Figure out the quote parameters needed to successfully complete this trade on chain
 * @param param
 * @returns
 * @exceptions
 */
export async function simulateSwap(params: SwapQuoteParam): Promise<SwapQuote> {
  const {
    fetcher,
    provider,
    aToB,
    clmmpoolData,
    tickArrays,
    tokenAmount,
    sqrtPriceLimit,
    amountLimit,
    byAmountIn,
  } = params;

  if (
    sqrtPriceLimit.gt(new BN(MAX_SQRT_PRICE)) ||
    sqrtPriceLimit.lt(new BN(MIN_SQRT_PRICE))
  ) {
    throw new ClmmpoolsError(
      "Provided SqrtPriceLimit is out of bounds.",
      SwapErrorCode.SqrtPriceOutOfBounds
    );
  }

  if (
    (aToB && sqrtPriceLimit.gt(clmmpoolData.currentSqrtPrice)) ||
    (!aToB && sqrtPriceLimit.lt(clmmpoolData.currentSqrtPrice))
  ) {
    throw new ClmmpoolsError(
      "Provided SqrtPriceLimit is in the opposite direction of the trade.",
      SwapErrorCode.InvalidSqrtPriceLimitDirection
    );
  }

  if (tokenAmount.eq(ZERO)) {
    throw new ClmmpoolsError(
      "Provided tokenAmount is zero.",
      SwapErrorCode.ZeroTradableAmount
    );
  }

  const tickSequence = new TickArraySequence(
    tickArrays,
    clmmpoolData.tickSpacing,
    aToB,
    0,
    clmmpoolData.currentTickIndex
  );

  const clmmConfig = await fetcher.getConfig(clmmpoolData.clmmConfig);

  const swapResults = computeSwap(
    clmmpoolData,
    tickSequence,
    tokenAmount,
    sqrtPriceLimit,
    byAmountIn,
    0,
    clmmConfig!.protocolFeeRate,
    aToB
  );

  const numOfTickCrossings = tickSequence.getNumOfTouchedArrays();
  if (numOfTickCrossings > MAX_TICK_ARRAY) {
    throw new ClmmpoolsError(
      `Input amount causes the quote to traverse more than the allowable amount of tick-arrays ${numOfTickCrossings}`,
      SwapErrorCode.TickArrayCrossingAboveMax
    );
  }

  let isExceed = false;
  if (aToB) {
    const balance = await getTokenBalance(provider, clmmpoolData.tokenBVault);
    if (swapResults.amountOut.toNumber() > Number(balance)) {
      isExceed = true;
    }
  } else {
    const balance = await getTokenBalance(provider, clmmpoolData.tokenAVault);
    if (swapResults.amountOut.toNumber() > Number(balance)) {
      isExceed = true;
    }
  }

  return {
    estimatedAmountIn: swapResults.amountIn,
    estimatedAmountOut: swapResults.amountOut,
    estimatedEndSqrtPrice: swapResults.nextSqrtPrice,
    estimatedFeeAmount: swapResults.feeAmount,
    isExceed,
    amount: tokenAmount,
    aToB,
    amountLimit,
    byAmountIn,
  };
}
