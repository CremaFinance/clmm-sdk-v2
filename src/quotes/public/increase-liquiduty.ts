import type { Address, BN } from "@project-serum/anchor";
import type { u64 } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import type Decimal from "decimal.js";
import invariant from "tiny-invariant";

import type { Clmmpool } from "../../clmmpool-client";
import { TickMath } from "../../math/tick";
import { ZERO } from "../../math/utils";
import type { IncreaseLiquidityInput } from "../../types/ix-types";
import { TickUtil } from "../../utils";
import { AddressUtil } from "../../utils/address-util";
import { DecimalUtil } from "../../utils/decimal-util";
import type { Percentage } from "../../utils/percentage";
import {
  adjustForSlippage,
  getLiquidityFromTokenA,
  getLiquidityFromTokenB,
  getTokenAFromLiquidity,
  getTokenBFromLiquidity,
  PositionStatus,
  PositionUtil,
} from "../../math/position";

/**
 * @param inputTokenAmount - The amount of input tokens to deposit.
 * @param inputTokenMint - The mint of the input token the user would like to deposit.
 * @param tokenMintA - The mint of tokenA in the clmmpool the user is depositing into.
 * @param tokenMintB -The mint of tokenB in the clmmpool the user is depositing into.
 * @param currentTickIndex - The clmmpool's current tickIndex.
 * @param currentSqrtPrice - The clmmpool's current sqrtPrice.
 * @param tickLowerIndex - The lower index of the position that we are withdrawing from.
 * @param tickUpperIndex - The upper index of the position that we are withdrawing from.
 * @param slippageTolerance - The maximum slippage allowed when calculating the minimum tokens received.
 */
export type IncreaseLiquidityQuoteParam = {
  inputTokenAmount: u64;
  inputTokenMint: PublicKey;
  tokenA: PublicKey;
  tokenB: PublicKey;
  currentTickIndex: number;
  currentSqrtPrice: BN;
  tickLowerIndex: number;
  tickUpperIndex: number;
  slippageTolerance: Percentage;
};

/**
 * Return object from increase liquidity quote functions.
 */
export type IncreaseLiquidityQuote = IncreaseLiquidityInput & {
  tokenEstA: u64;
  tokenEstB: u64;
};

/**
 * Get an estimated quote on the maximum tokens required to deposit based on a specified input token amount.
 *
 * @param inputTokenAmount - The amount of input tokens to deposit.
 * @param inputTokenMint - The mint of the input token the user would like to deposit.
 * @param tickLower - The lower index of the position that we are withdrawing from.
 * @param tickUpper - The upper index of the position that we are withdrawing from.
 * @param slippageTolerance - The maximum slippage allowed when calculating the minimum tokens received.
 * @param clmmpool - A clmmpool helper class to help interact with the clmmpool account.
 * @returns An IncreaseLiquidityInput object detailing the required token amounts & liquidity values to use when calling increase-liquidity-ix.
 */
export function increaseLiquidityQuoteByInputToken(
  inputTokenMint: Address,
  inputTokenAmount: Decimal,
  tickLower: number,
  tickUpper: number,
  slippageTolerance: Percentage,
  clmmpool: Clmmpool
): IncreaseLiquidityQuote {
  const data = clmmpool.getData();
  const tokenAInfo = clmmpool.getTokenAInfo();
  const tokenBInfo = clmmpool.getTokenBInfo();

  const inputMint = AddressUtil.toPubKey(inputTokenMint);
  const inputTokenInfo = inputMint.equals(tokenAInfo.mint)
    ? tokenAInfo
    : tokenBInfo;

  return increaseLiquidityQuoteByInputTokenWithParams({
    inputTokenAmount: DecimalUtil.toU64(
      inputTokenAmount,
      inputTokenInfo.decimals
    ),
    inputTokenMint: inputMint,
    tokenA: data.tokenA,
    tokenB: data.tokenB,
    currentSqrtPrice: data.currentSqrtPrice,
    currentTickIndex: data.currentTickIndex,
    tickLowerIndex: TickMath.getInitializableTickIndex(
      tickLower,
      data.tickSpacing
    ),
    tickUpperIndex: TickMath.getInitializableTickIndex(
      tickUpper,
      data.tickSpacing
    ),
    slippageTolerance,
  });
}

/**
 * Get an estimated quote on the maximum tokens required to deposit based on a specified input token amount.
 *
 * @param param IncreaseLiquidityQuoteParam
 * @returns An IncreaseLiquidityInput object detailing the required token amounts & liquidity values to use when calling increase-liquidity-ix.
 */
export function increaseLiquidityQuoteByInputTokenWithParams(
  param: IncreaseLiquidityQuoteParam
): IncreaseLiquidityQuote {
  invariant(
    TickUtil.checkTickInBounds(param.tickLowerIndex),
    "tickLowerIndex is out of bounds."
  );
  invariant(
    TickUtil.checkTickInBounds(param.tickUpperIndex),
    "tickUpperIndex is out of bounds."
  );
  invariant(
    param.inputTokenMint.equals(param.tokenA) ||
      param.inputTokenMint.equals(param.tokenB),
    `input token mint ${param.inputTokenMint.toBase58()} does not match any tokens in the provided pool.`
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
 * Get 
 * 
 * @param param 
 * @returns 
 */
function quotePositionBelowRange(
  param: IncreaseLiquidityQuoteParam
): IncreaseLiquidityQuote {
  const {
    tokenA,
    inputTokenMint,
    inputTokenAmount,
    tickLowerIndex,
    tickUpperIndex,
    slippageTolerance,
  } = param;

  if (!tokenA.equals(inputTokenMint)) {
    return {
      tokenMaxA: ZERO,
      tokenMaxB: ZERO,
      tokenEstA: ZERO,
      tokenEstB: ZERO,
      liquidityAmount: ZERO,
    };
  }

  const sqrtPriceLowerX64 = TickMath.tickIndexToSqrtPriceX64(tickLowerIndex);
  const sqrtPriceUpperX64 = TickMath.tickIndexToSqrtPriceX64(tickUpperIndex);

  const liquidityAmount = getLiquidityFromTokenA(
    inputTokenAmount,
    sqrtPriceLowerX64,
    sqrtPriceUpperX64,
    false
  );

  const tokenEstA = getTokenAFromLiquidity(
    liquidityAmount,
    sqrtPriceLowerX64,
    sqrtPriceUpperX64,
    true
  );
  const tokenMaxA = adjustForSlippage(tokenEstA, slippageTolerance, true);

  return {
    tokenMaxA,
    tokenMaxB: ZERO,
    tokenEstA,
    tokenEstB: ZERO,
    liquidityAmount,
  };
}

function quotePositionInRange(
  param: IncreaseLiquidityQuoteParam
): IncreaseLiquidityQuote {
  const {
    tokenA,
    currentSqrtPrice: sqrtPrice,
    inputTokenMint,
    inputTokenAmount,
    tickLowerIndex,
    tickUpperIndex,
    slippageTolerance,
  } = param;

  const sqrtPriceX64 = sqrtPrice;
  const sqrtPriceLowerX64 = TickMath.tickIndexToSqrtPriceX64(tickLowerIndex);
  const sqrtPriceUpperX64 = TickMath.tickIndexToSqrtPriceX64(tickUpperIndex);

  let [tokenEstA, tokenEstB] = tokenA.equals(inputTokenMint)
    ? [inputTokenAmount, undefined]
    : [undefined, inputTokenAmount];

  let liquidityAmount: BN;

  if (tokenEstA) {
    liquidityAmount = getLiquidityFromTokenA(
      tokenEstA,
      sqrtPriceX64,
      sqrtPriceUpperX64,
      false
    );
    tokenEstA = getTokenAFromLiquidity(
      liquidityAmount,
      sqrtPriceX64,
      sqrtPriceUpperX64,
      true
    );
    tokenEstB = getTokenBFromLiquidity(
      liquidityAmount,
      sqrtPriceLowerX64,
      sqrtPriceX64,
      true
    );
  } else if (tokenEstB) {
    liquidityAmount = getLiquidityFromTokenB(
      tokenEstB,
      sqrtPriceLowerX64,
      sqrtPriceX64,
      false
    );
    tokenEstA = getTokenAFromLiquidity(
      liquidityAmount,
      sqrtPriceX64,
      sqrtPriceUpperX64,
      true
    );
    tokenEstB = getTokenBFromLiquidity(
      liquidityAmount,
      sqrtPriceLowerX64,
      sqrtPriceX64,
      true
    );
  } else {
    throw new Error("invariant violation");
  }

  const tokenMaxA = adjustForSlippage(tokenEstA, slippageTolerance, true);
  const tokenMaxB = adjustForSlippage(tokenEstB, slippageTolerance, true);

  return {
    tokenMaxA,
    tokenMaxB,
    tokenEstA: tokenEstA,
    tokenEstB: tokenEstB,
    liquidityAmount,
  };
}

function quotePositionAboveRange(
  param: IncreaseLiquidityQuoteParam
): IncreaseLiquidityQuote {
  const {
    tokenB,
    inputTokenMint,
    inputTokenAmount,
    tickLowerIndex,
    tickUpperIndex,
    slippageTolerance,
  } = param;

  if (!tokenB.equals(inputTokenMint)) {
    return {
      tokenMaxA: ZERO,
      tokenMaxB: ZERO,
      tokenEstA: ZERO,
      tokenEstB: ZERO,
      liquidityAmount: ZERO,
    };
  }

  const sqrtPriceLowerX64 = TickMath.tickIndexToSqrtPriceX64(tickLowerIndex);
  const sqrtPriceUpperX64 = TickMath.tickIndexToSqrtPriceX64(tickUpperIndex);
  const liquidityAmount = getLiquidityFromTokenB(
    inputTokenAmount,
    sqrtPriceLowerX64,
    sqrtPriceUpperX64,
    false
  );

  const tokenEstB = getTokenBFromLiquidity(
    liquidityAmount,
    sqrtPriceLowerX64,
    sqrtPriceUpperX64,
    true
  );
  const tokenMaxB = adjustForSlippage(tokenEstB, slippageTolerance, true);

  return {
    tokenMaxA: ZERO,
    tokenMaxB,
    tokenEstA: ZERO,
    tokenEstB,
    liquidityAmount,
  };
}
