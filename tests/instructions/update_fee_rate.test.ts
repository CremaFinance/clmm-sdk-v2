import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import { assert } from "chai";

import { ClmmpoolContext, ClmmpoolIx } from "../../src";
import { MathUtil } from "../../src/math/utils";
import type { ClmmpoolData } from "../../src/types";
import { confirmTx, loadProvider, parseMessage, TickSpacing } from "../utils";
import { createFeeTier, createTestPool } from "../utils/init-utils";
import { generateDefaultConfigParams } from "../utils/test-builders";

describe("update_fee_rate", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully update a fee rate", async () => {
    // first create a clmm pool
    const { poolCreateInfo, configCreateInfo, configKeypairs } =
      await createTestPool(
        ctx,
        TickSpacing.Standard,
        MathUtil.toX64_BN(new anchor.BN(10))
      );

    const clmmpoolPubkey = poolCreateInfo.clmmpool;
    const configPubkey = configCreateInfo.clmmConfig;

    const newProtocolFeeRate = 1107;

    configCreateInfo.protocolFeeRate = newProtocolFeeRate;

    // create a new fee tier with new fee rate
    const feeTierParams = await createFeeTier(
      ctx,
      configCreateInfo,
      configKeypairs.protocolAuthorityKeypair,
      TickSpacing.Standard,
      newProtocolFeeRate
    );

    // update the pool fee rate
    const tx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.updateFeeRateIx(ctx.program, {
          newFeeRate: feeTierParams.params.feeRate,
          protocolAuthority: configKeypairs.protocolAuthorityKeypair.publicKey,
          clmmConfig: configPubkey,
          clmmpool: clmmpoolPubkey,
        }),
      ],
      [configKeypairs.protocolAuthorityKeypair]
    );

    await confirmTx(tx);

    const clmmpool = (await fetcher.getPool(clmmpoolPubkey)) as ClmmpoolData;
    assert.equal(clmmpool.feeRate, 1107);
  });

  it("fails when default fee rate exceeds max", async () => {
    // first create a clmm pool
    const { poolCreateInfo, configCreateInfo, configKeypairs } =
      await createTestPool(
        ctx,
        TickSpacing.Standard,
        MathUtil.toX64_BN(new anchor.BN(10))
      );

    const clmmpoolPubkey = poolCreateInfo.clmmpool;
    const configPubkey = configCreateInfo.clmmConfig;

    const newProtocolFeeRate = 1107;

    configCreateInfo.protocolFeeRate = newProtocolFeeRate;

    // create a new fee tier with new fee rate
    const feeTierParams = await createFeeTier(
      ctx,
      configCreateInfo,
      configKeypairs.protocolAuthorityKeypair,
      TickSpacing.Standard,
      newProtocolFeeRate
    );

    // update the pool fee rate
    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.updateFeeRateIx(ctx.program, {
        newFeeRate: feeTierParams.params.feeRate,
        protocolAuthority: configKeypairs.protocolAuthorityKeypair.publicKey,
        clmmConfig: configPubkey,
        clmmpool: clmmpoolPubkey,
      }),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal(
        "Signature verification failed",
        (e as Error).message.toString()
      );
    }
  });

  it("fails when clmmpool and clmmpools config don't match", async () => {
    // first create a clmm pool
    const { poolCreateInfo, configCreateInfo, configKeypairs } =
      await createTestPool(
        ctx,
        TickSpacing.Standard,
        MathUtil.toX64_BN(new anchor.BN(10))
      );

    const clmmpoolPubkey = poolCreateInfo.clmmpool;

    const newProtocolFeeRate = 1107;

    configCreateInfo.protocolFeeRate = newProtocolFeeRate;

    // create a new fee tier with new fee rate
    const feeTierParams = await createFeeTier(
      ctx,
      configCreateInfo,
      configKeypairs.protocolAuthorityKeypair,
      TickSpacing.Standard,
      newProtocolFeeRate
    );

    // create a new different config
    const {
      configInitInfo: otherConfigCreateInfo,
      configKeypairs: otherConfigKeypairs,
    } = generateDefaultConfigParams(ctx);

    // update the pool fee rate
    const tx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.updateFeeRateIx(ctx.program, {
          clmmpool: clmmpoolPubkey,
          clmmConfig: otherConfigCreateInfo.clmmConfig,
          newFeeRate: feeTierParams.params.feeRate,
          protocolAuthority:
            otherConfigKeypairs.protocolAuthorityKeypair.publicKey,
        }),
      ],
      [otherConfigKeypairs.protocolAuthorityKeypair]
    );

    // AnchorError caused by account: fee_tier.
    // Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("2006", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when fee authority is invalid", async () => {
    // first create a clmm pool
    const { poolCreateInfo, configCreateInfo, configKeypairs } =
      await createTestPool(
        ctx,
        TickSpacing.Standard,
        MathUtil.toX64_BN(new anchor.BN(10))
      );

    const clmmpoolPubkey = poolCreateInfo.clmmpool;
    const configPubkey = configCreateInfo.clmmConfig;

    const newProtocolFeeRate = 1107;

    configCreateInfo.protocolFeeRate = newProtocolFeeRate;

    // create a new fee tier with new fee rate
    const feeTierParams = await createFeeTier(
      ctx,
      configCreateInfo,
      configKeypairs.protocolAuthorityKeypair,
      TickSpacing.Standard,
      newProtocolFeeRate
    );

    const fakeAuthorityKeypair = anchor.web3.Keypair.generate();

    // update the pool fee rate
    const tx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.updateFeeRateIx(ctx.program, {
          clmmpool: clmmpoolPubkey,
          clmmConfig: configPubkey,
          newFeeRate: feeTierParams.params.feeRate,
          protocolAuthority: fakeAuthorityKeypair.publicKey,
        }),
      ],
      [fakeAuthorityKeypair]
    );

    // AnchorError caused by account: protocol_fee_authority.
    // Error Code: InvalidAuthority. Error Number: 6022. Error Message: Invalid authority.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6022", parseMessage((e as Error).message.toString()));
    }
  });
});
