import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import { assert } from "chai";

import { ClmmpoolContext, ClmmpoolIx, PDAUtil } from "../../src";
import type { FeeTierData } from "../../src/types";
import { TickSpacing } from "../utils";
import { createFeeTier, createFeeTierWithoutSign } from "../utils/init-utils";
import { generateDefaultConfigParams } from "../utils/test-builders";
import { ONE_SOL } from "../utils/test-consts";
import { confirmTx, loadProvider, parseMessage } from "../utils/utils";

describe("create_fee_tier", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully create a FeeRate stable account", async () => {
    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);
    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createClmmConfigIx(ctx.program, {
        ...configInitInfo,
      }),
    ]);

    await confirmTx(tx);

    const testTickSpacing = TickSpacing.Stable;
    const { params } = await createFeeTier(
      ctx,
      configInitInfo,
      configKeypairs.protocolAuthorityKeypair,
      testTickSpacing,
      800
    );

    const generatedPDA = PDAUtil.getFeeTierPDA(
      ctx.program.programId,
      configInitInfo.clmmConfig,
      testTickSpacing
    );

    const feeTierAccount = (await fetcher.getFeeTier(
      generatedPDA.publicKey
    )) as FeeTierData;

    assert.ok(feeTierAccount.tickSpacing === params.tickSpacing);
    assert.ok(feeTierAccount.feeRate === params.feeRate);
  });

  it("successfully create a FeeRate standard account", async () => {
    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);
    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createClmmConfigIx(ctx.program, {
        ...configInitInfo,
      }),
    ]);

    await confirmTx(tx);

    const testTickSpacing = TickSpacing.Standard;
    const { params } = await createFeeTier(
      ctx,
      configInitInfo,
      configKeypairs.protocolAuthorityKeypair,
      testTickSpacing,
      800
    );

    const generatedPDA = PDAUtil.getFeeTierPDA(
      ctx.program.programId,
      configInitInfo.clmmConfig,
      testTickSpacing
    );

    const feeTierAccount = (await fetcher.getFeeTier(
      generatedPDA.publicKey
    )) as FeeTierData;

    assert.ok(feeTierAccount.tickSpacing === params.tickSpacing);
    assert.ok(feeTierAccount.feeRate === params.feeRate);
  });

  it("successfully create a FeeRate with another funder wallet", async () => {
    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);

    const payerKeypair = anchor.web3.Keypair.generate();
    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: payerKeypair.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const testTickSpacing = TickSpacing.Standard;
    const { params } = await createFeeTier(
      ctx,
      configInitInfo,
      configKeypairs.protocolAuthorityKeypair,
      testTickSpacing,
      800,
      payerKeypair
    );

    const generatedPDA = PDAUtil.getFeeTierPDA(
      ctx.program.programId,
      configInitInfo.clmmConfig,
      testTickSpacing
    );

    const feeTierAccount = (await fetcher.getFeeTier(
      generatedPDA.publicKey
    )) as FeeTierData;

    assert.ok(feeTierAccount.tickSpacing === params.tickSpacing);
    assert.ok(feeTierAccount.feeRate === params.feeRate);
  });

  it("fails when default fee rate exceeds max", async () => {
    const testTickSpacing = TickSpacing.Standard;
    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);
    try {
      await createFeeTier(
        ctx,
        configInitInfo,
        configKeypairs.protocolAuthorityKeypair,
        testTickSpacing,
        2501
      );
    } catch (e) {
      assert.equal("6010", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when fee authority is not a signer", async () => {
    const { configInitInfo } = generateDefaultConfigParams(ctx);
    const testTickSpacing = TickSpacing.Stable;

    try {
      await createFeeTierWithoutSign(ctx, configInitInfo, testTickSpacing, 800);
    } catch (e) {
      assert.equal(
        "Signature verification failed",
        (e as Error).message.toString()
      );
    }
  });

  it("fails when invalid fee authority provided", async () => {
    const { configInitInfo } = generateDefaultConfigParams(ctx);

    const payerKeypair = anchor.web3.Keypair.generate();
    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: payerKeypair.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const testTickSpacing = TickSpacing.Standard;
    const fakeFeeAuthorityKeypair = anchor.web3.Keypair.generate();

    try {
      await createFeeTier(
        ctx,
        configInitInfo,
        fakeFeeAuthorityKeypair,
        testTickSpacing,
        800
      );
    } catch (e) {
      assert.equal(
        "unknown signer",
        (e as Error).message.toString().substring(0, 14)
      );
    }
  });
});
