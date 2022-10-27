import type { BN } from "@project-serum/anchor";
import invariant from "tiny-invariant";

import type { Clmmpool, Position } from "../../clmmpool-client";
import { TickMath } from "../../math/tick";
import { ZERO } from "../../math/utils";
import type { DecreaseLiquidityInput } from "../../types";
import type { Percentage } from "../../utils/percentage";
import {
  adjustForSlippage,
  getTokenAFromLiquidity,
  getTokenBFromLiquidity,
  PositionStatus,
  PositionUtil,
} from "../../math/position";
import { TickUtil } from "../../utils/tick";

/**
 * @param liquidity - The desired liquidity to withdraw from the Clmmpool
 * @param currentTickIndex - The Clmmpool's current tickIndex
 * @param currentSqrtPrice - The Clmmpool's current sqrtPrice
 * @param tickLowerIndex - The lower index of the position that we are withdrawing from
 * @param tickUpperIndex - The upper index of the position that we are withdrawing from
 * @param slippageTolerance - The maximum slippage allowed when calculating the minimum tokens received
 */
export type DecreaseLiquidityQuoteParam = {
  liquidity: BN;
  currentTickIndex: number;
  currentSqrtPrice: BN;
  tickLowerIndex: number;
  tickUpperIndex: number;
  slippageToLerance: Percentage;
};

/**
 * Return object from decrease liquidity quote functions.
 */
export type DecreaseLiquidityQuote = DecreaseLiquidityInput & {
  tokenEstA: BN;
  tokenEstB: BN;
};

/**
 * Get an estimated quote on the minimum tokens receivable based on the desired withdraw liquidity value when decrease liquidity.
 *
 * @param liquidity - The desired liquidity to withdraw from the Clmmpool
 * @param slippageTolerance - The maximum slippage allowed when calculating the minimum tokens received.
 * @param position - A Position helper class to help interact with the Position account.
 * @param clmmpool - A Clmmpool helper class to help interact with the Clmmpool account.
 * @returns An DecreaseLiquidityQuote object detailing the tokenMin & liquidity values to use when calling decrease-liquidity-ix.
 */
export async function decreaseLiquidityQuoteByLiquidity(
  liquidity: BN,
  slippageTolerance: Percentage,
  position: Position,
  clmmpool: Clmmpool
): Promise<DecreaseLiquidityQuote> {
  const positionData = position.getData();
  const clmmpoolData = clmmpool.getData();

  invariant(
    liquidity.lte(positionData.liquidity),
    "Quote liquidity is more than the position liquidity."
  );

  return decreaseLiquidityQuoteByLiquidityWithParams({
    liquidity,
    slippageToLerance: slippageTolerance,
    tickLowerIndex: positionData.tickLowerIndex,
    tickUpperIndex: positionData.tickUpperIndex,
    currentSqrtPrice: clmmpoolData.currentSqrtPrice,
    currentTickIndex: clmmpoolData.currentTickIndex,
  });
}

/**
 * Get an estimated decrease liquidity quote params on the minimum tokens receivable based on the desired withdraw liquidity value.
 *
 * @param param DecreaseLiquidityQuoteParam
 * @returns An DecreaseLiquidityInput object detailing the tokenMin & liquidity values to use when calling decrease-liquidity-ix.
 */
export function decreaseLiquidityQuoteByLiquidityWithParams(
  param: DecreaseLiquidityQuoteParam
): DecreaseLiquidityQuote {
  invariant(
    TickUtil.checkTickInBounds(param.tickLowerIndex),
    "tickLowerIndex is out of bounds."
  );
  invariant(
    TickUtil.checkTickInBounds(param.tickUpperIndex),
    "tickUpperIndex is out of bounds."
  );
  invariant(
    TickUtil.checkTickInBounds(param.currentTickIndex),
    "tickCurrentIndex is out of bounds."
  );

  const positionStatus = PositionUtil.getPositionStatus(
    param.currentTickIndex,
    param.tickLowerIndex,
    param.tickUpperIndex
  );

  switch (positionStatus) {
    case PositionStatus.BelowRange:
      return quotePositionBelowRange(param);
    case PositionStatus.InRange:
      return quotePositionInRange(param);
    case PositionStatus.AboveRange:
      return quotePositionAboveRange(param);
    default:
      throw new Error(`type ${positionStatus} is an unknown PositionStatus`);
  }
}

/**
 * Get the decrease liquidity quote params for a position that is below the current tick.
 * 
 * @param param - DecreaseLiquidityQuoteParam
 * @returns 
 */
function quotePositionBelowRange(
  param: DecreaseLiquidityQuoteParam
): DecreaseLiquidityQuote {
  const {
    tickLowerIndex,
    tickUpperIndex,
    liquidity,
    slippageToLerance: slippageTolerance,
  } = param;

  const sqrtPriceLowerX64 = TickMath.tickIndexToSqrtPriceX64(tickLowerIndex);
  const sqrtPriceUpperX64 = TickMath.tickIndexToSqrtPriceX64(tickUpperIndex);

  const tokenEstA = getTokenAFromLiquidity(
    liquidity,
    sqrtPriceLowerX64,
    sqrtPriceUpperX64,
    false
  );
  const tokenMinA = adjustForSlippage(tokenEstA, slippageTolerance, false);

  return {
    tokenMinA,
    tokenMinB: ZERO,
    tokenEstA,
    tokenEstB: ZERO,
    liquidityAmount: liquidity,
  };
}

/**
 * Get quote params for a position that is in the current tick.
 * 
 * @param param - DecreaseLiquidityQuoteParam
 * @returns 
 */
function quotePositionInRange(
  param: DecreaseLiquidityQuoteParam
): DecreaseLiquidityQuote {
  const {
    currentSqrtPrice: sqrtPrice,
    tickLowerIndex,
    tickUpperIndex,
    liquidity,
    slippageToLerance: slippageTolerance,
  } = param;

  const sqrtPriceX64 = sqrtPrice;
  const sqrtPriceLowerX64 = TickMath.tickIndexToSqrtPriceX64(tickLowerIndex);
  const sqrtPriceUpperX64 = TickMath.tickIndexToSqrtPriceX64(tickUpperIndex);

  const tokenEstA = getTokenAFromLiquidity(
    liquidity,
    sqrtPriceX64,
    sqrtPriceUpperX64,
    false
  );
  const tokenMinA = adjustForSlippage(tokenEstA, slippageTolerance, false);
  const tokenEstB = getTokenBFromLiquidity(
    liquidity,
    sqrtPriceLowerX64,
    sqrtPriceX64,
    false
  );
  const tokenMinB = adjustForSlippage(tokenEstB, slippageTolerance, false);

  return {
    tokenMinA,
    tokenMinB,
    tokenEstA,
    tokenEstB,
    liquidityAmount: liquidity,
  };
}

/**
 * Get quote params for a position that is above the current tick.
 * @param param - DecreaseLiquidityQuoteParam
 * @returns 
 */
function quotePositionAboveRange(
  param: DecreaseLiquidityQuoteParam
): DecreaseLiquidityQuote {
  const {
    tickLowerIndex,
    tickUpperIndex,
    liquidity,
    slippageToLerance: slippageTolerance,
  } = param;

  const sqrtPriceLowerX64 = TickMath.tickIndexToSqrtPriceX64(tickLowerIndex);
  const sqrtPriceUpperX64 = TickMath.tickIndexToSqrtPriceX64(tickUpperIndex);

  const tokenEstB = getTokenBFromLiquidity(
    liquidity,
    sqrtPriceLowerX64,
    sqrtPriceUpperX64,
    false
  );
  const tokenMinB = adjustForSlippage(tokenEstB, slippageTolerance, false);

  return {
    tokenMinA: ZERO,
    tokenMinB,
    tokenEstA: ZERO,
    tokenEstB,
    liquidityAmount: liquidity,
  };
}
