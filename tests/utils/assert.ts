import type { Program } from "@project-serum/anchor";
import { BN, web3 } from "@project-serum/anchor";
import { AccountLayout } from "@solana/spl-token";
import * as assert from "assert";

import type { SwapQuote } from "../../src";
import type { Clmmpool } from "../../src/idls/clmmpool";
import type { ClmmpoolData, TickData } from "../../src/types";
import { TEST_TOKEN_PROGRAM_ID } from "./test-consts";
import type { VaultAmounts } from "./whirlpools-test-utils";

/**
 * @category Math
 */
export const ONE = new BN(1);

export function assertInputOutputQuoteEqual(
  inputTokenQuote: SwapQuote,
  outputTokenQuote: SwapQuote
) {
  assert.equal(inputTokenQuote.aToB, outputTokenQuote.aToB, "aToB not equal");
  // TODO: Sometimes input & output estimated In is off by 1. Same goes for sqrt-price
  assert.ok(
    inputTokenQuote.estimatedAmountIn
      .sub(outputTokenQuote.estimatedAmountIn)
      .abs()
      .lte(ONE),
    `input estimated In ${inputTokenQuote.estimatedAmountIn} does not equal output estimated in ${outputTokenQuote.estimatedAmountIn}`
  );
  assert.ok(
    inputTokenQuote.estimatedAmountOut
      .sub(outputTokenQuote.estimatedAmountOut)
      .abs()
      .lte(ONE),
    `input estimated out ${inputTokenQuote.estimatedAmountOut} does not equal output estimated out ${outputTokenQuote.estimatedAmountOut}`
  );
  assert.equal(
    inputTokenQuote.estimatedFeeAmount.toString(),
    outputTokenQuote.estimatedFeeAmount.toString(),
    "estimatedFeeAmount not equal"
  );
  assert.notEqual(
    inputTokenQuote.byAmountIn,
    outputTokenQuote.byAmountIn,
    "amountSpecifiedIsInput equals"
  );
}

export function assertQuoteAndResults(
  aToB: boolean,
  quote: SwapQuote,
  endData: ClmmpoolData,
  beforeVaultAmounts: VaultAmounts,
  afterVaultAmounts: VaultAmounts
) {
  const tokenADelta = beforeVaultAmounts.tokenA.sub(afterVaultAmounts.tokenA);
  const tokenBDelta = beforeVaultAmounts.tokenB.sub(afterVaultAmounts.tokenB);

  assert.equal(
    quote.estimatedAmountIn.toString(),
    (aToB ? tokenADelta : tokenBDelta).neg().toString()
  );
  assert.equal(
    quote.estimatedAmountOut.toString(),
    (aToB ? tokenBDelta : tokenADelta).toString()
  );
  assert.equal(
    quote.estimatedEndSqrtPrice.toString(),
    endData.currentSqrtPrice.toString()
  );
}

// Helper for token vault assertion checks.
export async function asyncAssertTokenVault(
  program: Program<Clmmpool>,
  tokenVaultPublicKey: web3.PublicKey,
  expectedValues: {
    expectedOwner: web3.PublicKey;
    expectedMint: web3.PublicKey;
  }
) {
  const tokenVault: web3.AccountInfo<Buffer> | null =
    await program.provider.connection.getAccountInfo(tokenVaultPublicKey);
  if (!tokenVault) {
    assert.fail(
      `token vault does not exist at ${tokenVaultPublicKey.toBase58()}`
    );
  }
  const tokenVaultAData = AccountLayout.decode(tokenVault.data);
  assert.ok(tokenVault.owner.equals(TEST_TOKEN_PROGRAM_ID));
  assert.ok(
    expectedValues.expectedOwner.equals(
      new web3.PublicKey(tokenVaultAData.owner)
    )
  );
  assert.ok(
    expectedValues.expectedMint.equals(new web3.PublicKey(tokenVaultAData.mint))
  );
}

export function assertTick(
  tick: TickData,
  isInitialized: boolean,
  liquidityGross: BN,
  liquidityNet: BN
) {
  assert.ok(tick.isInitialized === isInitialized);
  assert.ok(tick.liquidityNet.eq(liquidityNet));
  assert.ok(tick.liquidityGross.eq(liquidityGross));
}
