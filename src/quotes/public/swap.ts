import type { Address, BN } from "@project-serum/anchor";
import type { u64 } from "@solana/spl-token";
import invariant from "tiny-invariant";

import type { Clmmpool } from "../../clmmpool-client";
import type { SwapInput } from "../../ix";
import type { AccountFetcher } from "../../network/fetcher";
import type { ClmmpoolData, TickArray } from "../../types";
import { AddressUtil } from "../../utils/address-util";
import { ClmmPoolUtil } from "../../utils/clmm";
import type { Percentage } from "../../utils/percentage";
import { SwapUtils } from "../../utils/swap";
import { TickArrayUtil } from "../../utils/tick";
import { TokenType } from "../../utils/types";
import { simulateSwap } from "../swap/swap-quote-impl";

/**
 * @category Quotes
 *
 * @param tokenAmount - The amount of input or output token to swap from (depending on amountSpecifiedIsInput).
 * @param otherAmountThreshold - The maximum/minimum of input/output token to swap into (depending on amountSpecifiedIsInput).
 * @param sqrtPriceLimit - The maximum/minimum price the swap will swap to.
 * @param aToB - The direction of the swap. True if swapping from A to B. False if swapping from B to A.
 * @param amountSpecifiedIsInput - Specifies the token the parameter `amount`represents. If true, the amount represents
 *                                 the input token of the swap.
 * @param tickArrays - An sequential array of tick-array objects in the direction of the trade to swap on
 */
export type SwapQuoteParam = {
  clmmpoolData: ClmmpoolData;
  tokenAmount: u64;
  amountLimit: u64;
  sqrtPriceLimit: BN;
  aToB: boolean;
  byAmountIn: boolean;
  tickArrays: TickArray[];
};

/**
 * A collection of estimated values from quoting a swap.
 * @category Quotes
 * @param estimatedAmountIn - Approximate number of input token swapped in the swap
 * @param estimatedAmountOut - Approximate number of output token swapped in the swap
 * @param estimatedEndTickIndex - Approximate tick-index the Whirlpool will land on after this swap
 * @param estimatedEndSqrtPrice - Approximate sqrtPrice the Whirlpool will land on after this swap
 * @param estimatedFeeAmount - Approximate feeAmount (all fees) charged on this swap
 */
export type SwapQuote = {
  estimatedAmountIn: u64;
  estimatedAmountOut: u64;
  estimatedEndSqrtPrice: BN;
  estimatedFeeAmount: u64;
  isExceed: boolean;
} & SwapInput;

/**
 * Get an estimated swap quote using input token amount.
 *
 * @category Quotes
 * @param whirlpool - Whirlpool to perform the swap on
 * @param inputTokenMint - PublicKey for the input token mint to swap with
 * @param tokenAmount - The amount of input token to swap from
 * @param slippageTolerance - The amount of slippage to account for in this quote
 * @param programId - PublicKey for the Whirlpool ProgramId
 * @param fetcher - AccountFetcher object to fetch solana accounts
 * @param refresh - If true, fetcher would default to fetching the latest accounts
 * @returns a SwapQuote object with slippage adjusted SwapInput parameters & estimates on token amounts, fee & end whirlpool states.
 */
export async function swapQuoteByInputToken(
  whirlpool: Clmmpool,
  inputTokenMint: Address,
  tokenAmount: u64,
  slippageTolerance: Percentage,
  programId: Address,
  fetcher: AccountFetcher,
  refresh: boolean
): Promise<SwapQuote> {
  return swapQuoteByToken(
    whirlpool,
    inputTokenMint,
    tokenAmount,
    slippageTolerance,
    TokenType.TokenA,
    true,
    programId,
    fetcher,
    refresh
  );
}

/**
 * Get an estimated swap quote using an output token amount.
 *
 * Use this quote to get an estimated amount of input token needed to receive
 * the defined output token amount.
 *
 * @category Quotes
 * @param whirlpool - Whirlpool to perform the swap on
 * @param outputTokenMint - PublicKey for the output token mint to swap into
 * @param tokenAmount - The maximum amount of output token to receive in this swap.
 * @param slippageTolerance - The amount of slippage to account for in this quote
 * @param programId - PublicKey for the Whirlpool ProgramId
 * @param fetcher - AccountFetcher object to fetch solana accounts
 * @param refresh - If true, fetcher would default to fetching the latest accounts
 * @returns a SwapQuote object with slippage adjusted SwapInput parameters & estimates on token amounts, fee & end whirlpool states.
 */
export async function swapQuoteByOutputToken(
  whirlpool: Clmmpool,
  outputTokenMint: Address,
  tokenAmount: u64,
  slippageTolerance: Percentage,
  programId: Address,
  fetcher: AccountFetcher,
  refresh: boolean
): Promise<SwapQuote> {
  return swapQuoteByToken(
    whirlpool,
    outputTokenMint,
    tokenAmount,
    slippageTolerance,
    TokenType.TokenB,
    false,
    programId,
    fetcher,
    refresh
  );
}

/**
 * Perform a sync swap quote based on the basic swap instruction parameters.
 *
 * @category Quotes
 * @param params - SwapQuote parameters
 * @param slippageTolerance - The amount of slippage to account for when generating the final quote.
 * @returns a SwapQuote object with slippage adjusted SwapInput parameters & estimates on token amounts, fee & end whirlpool states.
 */
export async function swapQuoteWithParams(
  fetcher: AccountFetcher,
  params: SwapQuoteParam,
  slippageTolerance: Percentage
) {
  checkIfAllTickArraysInitialized(params.tickArrays);

  const quote = await simulateSwap(fetcher, params);

  const slippageAdjustedQuote: SwapQuote = {
    ...quote,
    ...SwapUtils.calculateSwapAmountsFromQuote(
      params.tokenAmount,
      quote.estimatedAmountIn,
      quote.estimatedAmountOut,
      slippageTolerance,
      params.byAmountIn
    ),
  };

  return slippageAdjustedQuote;
}

async function swapQuoteByToken(
  whirlpool: Clmmpool,
  inputTokenMint: Address,
  tokenAmount: u64,
  slippageTolerance: Percentage,
  amountSpecifiedTokenType: TokenType,
  amountSpecifiedIsInput: boolean,
  programId: Address,
  fetcher: AccountFetcher,
  refresh: boolean
) {
  const whirlpoolData = whirlpool.getData();
  const swapMintKey = AddressUtil.toPubKey(inputTokenMint);
  const swapTokenType = ClmmPoolUtil.getTokenType(whirlpoolData, swapMintKey);
  invariant(
    !!swapTokenType,
    "swapTokenMint does not match any tokens on this pool"
  );

  const aToB = swapTokenType === amountSpecifiedTokenType;

  const tickArrays = await SwapUtils.getTickArrays(
    whirlpoolData.currentTickIndex,
    whirlpoolData.tickSpacing,
    AddressUtil.toPubKey(programId),
    whirlpool.getAddress(),
    fetcher,
    refresh
  );

  return swapQuoteWithParams(
    fetcher,
    {
      clmmpoolData: whirlpoolData,
      tokenAmount,
      aToB,
      byAmountIn: amountSpecifiedIsInput,
      sqrtPriceLimit: SwapUtils.getDefaultSqrtPriceLimit(aToB),
      amountLimit: SwapUtils.getDefaultOtherAmountThreshold(
        amountSpecifiedIsInput
      ),
      tickArrays,
    },
    slippageTolerance
  );
}

function checkIfAllTickArraysInitialized(tickArrays: TickArray[]) {
  // Check if all the tick arrays have been initialized.
  const uninitializedIndices = TickArrayUtil.getUninitializedArrays(
    tickArrays.map((array) => array.data)
  );
  if (uninitializedIndices.length > 0) {
    const uninitializedArrays = uninitializedIndices
      .map((index) => tickArrays[index]!.address.toBase58())
      .join(", ");
    throw new Error(
      `TickArray addresses - [${uninitializedArrays}] need to be initialized.`
    );
  }
}
