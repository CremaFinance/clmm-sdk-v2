import type { Address } from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import { u64 } from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";

import { TickMath } from "../math/tick";
import { MathUtil, ZERO } from "../math/utils";
import type { IncreaseLiquidityInput } from "../types";
import { CLMMPOOL_PROGRAM_ID, FEE_RATE_DENOMINATOR } from "../types";
import type { ClmmpoolData } from "../types/clmmpool";
import { AddressUtil } from "./address-util";
import { Percentage } from "./percentage";
import { TokenType } from "./types";

/**
 * @category Clmm pool Util
 */
export class ClmmPoolUtil {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Get token type.
   *
   * @param clmmpool - clmmpool data
   * @param mint - mint address
   *
   * @returns token type
   */
  static getTokenType(
    clmmpool: ClmmpoolData,
    mint: PublicKey
  ): TokenType | undefined {
    if (clmmpool.tokenA.equals(mint)) {
      return TokenType.TokenA;
    } else if (clmmpool.tokenB.equals(mint)) {
      return TokenType.TokenB;
    }
    return undefined;
  }

  /**
   * Get fee rate.
   *
   * @param feeRate - clmmpool data
   *
   * @returns percentage
   */
  static getFeeRate(feeRate: number): Percentage {
    return Percentage.fromFraction(feeRate, 1e6);
  }

  /**
   * Update fee rate.
   *
   * @param clmm - clmmpool data
   * @param fee_amount - fee Amount
   * @param ref_rate - ref rate
   * @param is_token_A - is token A
   *
   * @returns percentage
   */
  static updateFeeRate(
    clmm: ClmmpoolData,
    fee_amount: BN,
    ref_rate: number,
    protocolFeeRate: number,
    is_token_A: boolean
  ) {
    const protocolFee = MathUtil.checkMulDivCeil(
      fee_amount,
      new BN(protocolFeeRate),
      FEE_RATE_DENOMINATOR,
      64
    );

    const refFee =
      ref_rate === 0
        ? ZERO
        : MathUtil.checkMulDivFloor(
            fee_amount,
            new BN(ref_rate),
            FEE_RATE_DENOMINATOR,
            64
          );

    const poolFee = fee_amount.mul(protocolFee).mul(refFee);

    if (is_token_A) {
      clmm.feeProtocolTokenA = clmm.feeProtocolTokenA.add(protocolFee);
    } else {
      clmm.feeProtocolTokenB = clmm.feeProtocolTokenB.add(protocolFee);
    }

    if (poolFee.eq(ZERO) || clmm.liquidity.eq(ZERO)) {
      return { refFee, clmm };
    }

    const growthFee = poolFee.shln(64).div(clmm.liquidity);

    if (is_token_A) {
      clmm.feeGrowthGlobalA = clmm.feeGrowthGlobalA.add(growthFee);
    } else {
      clmm.feeGrowthGlobalB = clmm.feeGrowthGlobalB.add(growthFee);
    }

    return { refFee, clmm };
  }

  /**
   * Get protocol fee rate.
   *
   * @param protocolFeeRate - protocol fee rate
   *
   * @returns percentage
   */
  static getProtocolFeeRate(protocolFeeRate: number): Percentage {
    return Percentage.fromFraction(protocolFeeRate, 1e4);
  }

  /**
   * Order mints.
   *
   * @param mintX - One mint
   * @param mintY - Another mint
   * @returns percentage
   */
  static orderMints(mintX: Address, mintY: Address): [Address, Address] {
    let mintA, mintB;
    if (
      Buffer.compare(
        AddressUtil.toPubKey(mintX).toBuffer(),
        AddressUtil.toPubKey(mintY).toBuffer()
      ) < 0
    ) {
      mintA = mintX;
      mintB = mintY;
    } else {
      mintA = mintY;
      mintB = mintX;
    }

    return [mintA, mintB];
  }

  /**
   * Get token amount fron liquidity.
   *
   * @param liquidity - liquidity
   * @param curSqrtPrice - Pool current sqrt price
   * @param lowerPrice - lower price
   * @param upperPrice - upper price
   * @param roundUp - is round up
   *
   * @returns
   */
  static getTokenAmountFromLiquidity(
    liquidity: BN,
    curSqrtPrice: BN,
    lowerPrice: BN,
    upperPrice: BN,
    roundUp: boolean
  ): TokenAmounts {
    const liq = new Decimal(liquidity.toString());
    const curSqrtPriceStr = new Decimal(curSqrtPrice.toString());
    const lowerPriceStr = new Decimal(lowerPrice.toString());
    const upperPriceStr = new Decimal(upperPrice.toString());
    let tokenA, tokenB;
    if (curSqrtPrice.lt(lowerPrice)) {
      tokenA = MathUtil.toX64_Decimal(liq)
        .mul(upperPriceStr.sub(lowerPriceStr))
        .div(lowerPriceStr.mul(upperPriceStr));

      tokenB = new Decimal(0);
    } else if (curSqrtPrice.lt(upperPrice)) {
      tokenA = MathUtil.toX64_Decimal(liq)
        .mul(upperPriceStr.sub(curSqrtPriceStr))
        .div(curSqrtPriceStr.mul(upperPriceStr));

      tokenB = MathUtil.fromX64_Decimal(
        liq.mul(curSqrtPriceStr.sub(lowerPriceStr))
      );
    } else {
      tokenA = new Decimal(0);
      tokenB = MathUtil.fromX64_Decimal(
        liq.mul(upperPriceStr.sub(lowerPriceStr))
      );
    }

    if (roundUp) {
      return {
        tokenA: new u64(tokenA.ceil().toString()),
        tokenB: new u64(tokenB.ceil().toString()),
      };
    } else {
      return {
        tokenA: new u64(tokenA.floor().toString()),
        tokenB: new u64(tokenB.floor().toString()),
      };
    }
  }

  /**
   * Estimate liquidity from token amounts
   *
   * @param curr_tick - current tick index.
   * @param lower_tick - lower tick
   * @param upper_tick - upper tick
   * @param token_amount - token amount
   *
   * @return liquidity
   */
  static estimateLiquidityFromTokenAmounts(
    cur_sqrt_price: BN,
    lower_tick: number,
    upper_tick: number,
    token_amount: TokenAmounts
  ): BN {
    if (lower_tick > upper_tick) {
      throw new Error("lower tick cannot be greater than lower tick");
    }

    const curr_tick = TickMath.sqrtPriceX64ToTickIndex(cur_sqrt_price);
    const lowerSqrtPrice = TickMath.tickIndexToSqrtPriceX64(lower_tick);
    const upperSqrtPrice = TickMath.tickIndexToSqrtPriceX64(upper_tick);

    if (curr_tick < lower_tick) {
      return estimateLiquidityForTokenA(
        lowerSqrtPrice,
        upperSqrtPrice,
        token_amount.tokenA
      );
    } else if (curr_tick >= upper_tick) {
      return estimateLiquidityForTokenB(
        upperSqrtPrice,
        lowerSqrtPrice,
        token_amount.tokenB
      );
    } else {
      const estimateLiquidityAmountA = estimateLiquidityForTokenA(
        cur_sqrt_price,
        upperSqrtPrice,
        token_amount.tokenA
      );

      const estimateLiquidityAmountB = estimateLiquidityForTokenB(
        cur_sqrt_price,
        lowerSqrtPrice,
        token_amount.tokenB
      );

      return BN.min(estimateLiquidityAmountA, estimateLiquidityAmountB);
    }
  }

  /**
   * Estimate liquidity and token amount from one amounts
   *
   * @param current_tick - current tick index.
   * @param lower_tick - lower tick
   * @param upper_tick - upper tick
   * @param token_amount - token amount
   * @param is_token_A - is token A
   * @param round_up - is round up
   * @param is_increase - is increase
   * @param slippage - slippage percentage
   *
   * @return IncreaseLiquidityInput
   */
  static estLiquidityAndTokenAmountFromOneAmounts(
    lower_tick: number,
    upper_tick: number,
    token_amount: u64,
    is_token_A: boolean,
    round_up: boolean,
    is_increase: boolean,
    slippage: number,
    cur_sqrt_price: BN
  ): IncreaseLiquidityInput {
    const current_tick = TickMath.sqrtPriceX64ToTickIndex(cur_sqrt_price);
    const lowerSqrtPrice = TickMath.tickIndexToSqrtPriceX64(lower_tick);
    const upperSqrtPrice = TickMath.tickIndexToSqrtPriceX64(upper_tick);

    let liquidity;
    if (current_tick <= lower_tick) {
      if (!is_token_A) {
        throw new Error("lower tick cannot calculate liquidity by tokenB");
      }

      liquidity = estimateLiquidityForTokenA(
        lowerSqrtPrice,
        upperSqrtPrice,
        token_amount
      );
    } else if (current_tick >= upper_tick) {
      if (is_token_A) {
        throw new Error("upper tick cannot calculate liquidity by tokenA");
      }

      liquidity = estimateLiquidityForTokenB(
        upperSqrtPrice,
        lowerSqrtPrice,
        token_amount
      );
    } else {
      if (is_token_A) {
        liquidity = estimateLiquidityForTokenA(
          cur_sqrt_price,
          upperSqrtPrice,
          token_amount
        );
      } else {
        liquidity = estimateLiquidityForTokenB(
          cur_sqrt_price,
          lowerSqrtPrice,
          token_amount
        );
      }
    }

    const tokenAmounts = ClmmPoolUtil.getTokenAmountFromLiquidity(
      liquidity,
      cur_sqrt_price,
      lowerSqrtPrice,
      upperSqrtPrice,
      round_up
    );

    let tokenMaxA, tokenMaxB;
    if (is_increase) {
      tokenMaxA = tokenAmounts.tokenA.mul(new u64(1 + slippage));
      tokenMaxB = tokenAmounts.tokenB.mul(new u64(1 + slippage));
    } else {
      tokenMaxA = tokenAmounts.tokenA.mul(new u64(1 - slippage));
      tokenMaxB = tokenAmounts.tokenB.mul(new u64(1 - slippage));
    }

    return {
      tokenMaxA,
      tokenMaxB,
      liquidityAmount: liquidity,
    };
  }

  /**
   * To base quote order
   *
   * @param mint_A - token A mint key
   * @param mint_B - token B mint key
   *
   * @return
   */
  static toBaseQuoteOrder(
    mint_A: PublicKey,
    mint_B: PublicKey
  ): [PublicKey, PublicKey] {
    const pair: [PublicKey, PublicKey] = [mint_A, mint_B];
    return pair.sort(sortByQuotePriority);
  }
}

/**
 * @category TokenAmounts.
 */
export type TokenAmounts = {
  tokenA: u64;
  tokenB: u64;
};

/**
 * Create two token to token amount
 *
 * @param a - token A amount
 * @param b - token B amount
 *
 * @return
 */
export function toTokenAmount(a: number, b: number): TokenAmounts {
  return {
    tokenA: new u64(a.toString()),
    tokenB: new u64(b.toString()),
  };
}

/**
 * QUOTE—TOKENS.
 */
const QUOTE_TOKENS: { [mint: string]: number } = {
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 6, // USDT
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 5, // USDC
  USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX: 4, // USDH
  So11111111111111111111111111111111111111112: 3, // SOL
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: 2, // mSOL
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": 1, // stSOL
};

const DEFAULT_QUOTE_TOKEN_PRIORITY = 0;

/**
 * Get quote token priority
 *
 * @param mint - mint address
 *
 * @return
 */
function getQuoteTokenPriority(mint: string): number {
  const value = QUOTE_TOKENS[mint];
  if (value) {
    return value;
  }
  return DEFAULT_QUOTE_TOKEN_PRIORITY;
}

/**
 * Sort by quote priority
 *
 * @param mint_x - One mint address
 * @param mint_y - Another mint address
 *
 * @return
 */
function sortByQuotePriority(mint_x: PublicKey, mint_y: PublicKey): number {
  return (
    getQuoteTokenPriority(mint_x.toString()) -
    getQuoteTokenPriority(mint_y.toString())
  );
}

/**
 * Estimate liquidity for token A
 *
 * @param sqrt_price_x - token A sqrtprice
 * @param sqrt_price_y - token B sqrtprice
 * @param tokenAmount - token amount
 *
 * @return
 */
export function estimateLiquidityForTokenA(
  sqrt_price_x: BN,
  sqrt_price_y: BN,
  tokenAmount: u64
) {
  const lowerSqrtPriceX64 = BN.min(sqrt_price_x, sqrt_price_y);
  const upperSqrtPriceX64 = BN.max(sqrt_price_x, sqrt_price_y);

  const num = MathUtil.fromX64_BN(
    tokenAmount.mul(upperSqrtPriceX64).mul(lowerSqrtPriceX64)
  );
  const dem = upperSqrtPriceX64.sub(lowerSqrtPriceX64);

  return num.div(dem);
}

/**
 * Estimate liquidity for token B
 *
 * @param sqrt_price_x - token A sqrtprice
 * @param sqrt_price_y - token B sqrtprice
 * @param token_amount - token amount
 *
 * @return
 */
export function estimateLiquidityForTokenB(
  sqrtPrice0: BN,
  sqrtPrice1: BN,
  token_amount: u64
) {
  const lowerSqrtPriceX64 = BN.min(sqrtPrice0, sqrtPrice1);
  const upperSqrtPriceX64 = BN.max(sqrtPrice0, sqrtPrice1);

  const delta = upperSqrtPriceX64.sub(lowerSqrtPriceX64);

  return token_amount.shln(64).div(delta);
}

// Only clmmpool accounts in this program has 168 length.
/**
 * Get all clmmpools
 *
 * @param connection - Solana connection
 *
 * @return
 */
export function getAllClmmpools(connection: Connection) {
  const clmmpools = connection.getProgramAccounts(CLMMPOOL_PROGRAM_ID, {
    filters: [
      {
        dataSize: 747,
      },
    ],
  });
  return clmmpools;
}
