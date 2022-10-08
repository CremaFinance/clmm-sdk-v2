import type * as anchor from "@project-serum/anchor";
import type { u64 } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";

import type {
  Clmmpool,
  ClmmpoolClient,
  ClmmpoolContext,
  Percentage,
} from "../../src";
import type { TickSpacing } from ".";
import type { FundedPositionParams } from "./init-utils";
import { TICK_ARRAY_SIZE } from "../../src/types";

export interface SwapTestPoolParams {
  ctx: ClmmpoolContext;
  client: ClmmpoolClient;
  tickSpacing: TickSpacing;
  initSqrtPrice: anchor.BN;
  initArrayStartTicks: number[];
  fundedPositions: FundedPositionParams[];
  tokenMintAmount?: anchor.BN;
}

export interface SwapTestSwapParams {
  swapAmount: u64;
  aToB: boolean;
  amountSpecifiedIsInput: boolean;
  slippageTolerance: Percentage;
  tickArrayAddresses: PublicKey[];
}

export interface SwapTestSetup {
  clmmpool: Clmmpool;
  tickArrayAddresses: PublicKey[];
}

export interface ArrayTickIndex {
  arrayIndex: number;
  offsetIndex: number;
}

export function arrayTickIndexToTickIndex(
  index: ArrayTickIndex,
  tickSpacing: number
) {
  return (
    index.arrayIndex * TICK_ARRAY_SIZE * tickSpacing +
    index.offsetIndex * tickSpacing
  );
}

export function buildPosition(
  lower: ArrayTickIndex,
  upper: ArrayTickIndex,
  tickSpacing: number,
  liquidityAmount: anchor.BN
) {
  return {
    tickLowerIndex: arrayTickIndexToTickIndex(lower, tickSpacing),
    tickUpperIndex: arrayTickIndexToTickIndex(upper, tickSpacing),
    liquidityAmount,
  };
}
