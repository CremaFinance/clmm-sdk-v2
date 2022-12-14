import type { BN } from "@project-serum/anchor";
import type { u64 } from "@solana/spl-token";

/**
 * Input parameters to deposit liquidity into a position.
 *
 * @category Instruction Types
 * @param tokenMaxA - the maximum amount of tokenA allowed to withdraw from the source wallet.
 * @param tokenMaxB - the maximum amount of tokenB allowed to withdraw from the source wallet.
 * @param liquidityAmount - the desired amount of liquidity to deposit into the position.
 */
export type DecreaseLiquidityInput = {
  tokenMinA: BN;
  tokenMinB: BN;
  liquidityAmount: BN;
};

/**
 * Input parameters to deposit liquidity into a position.
 *
 * This type is usually generated by a quote class to estimate the amount of tokens required to
 * deposit a certain amount of liquidity into a position.
 *
 * @category Instruction Types
 * @param tokenMaxA - the maximum amount of tokenA allowed to withdraw from the source wallet.
 * @param tokenMaxB - the maximum amount of tokenB allowed to withdraw from the source wallet.
 * @param liquidityAmount - the desired amount of liquidity to deposit into the position.
 */
export type IncreaseLiquidityInput = {
  tokenMaxA: u64;
  tokenMaxB: u64;
  liquidityAmount: BN;
};
