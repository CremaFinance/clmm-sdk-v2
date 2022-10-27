import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import { assert } from "chai";

import type { CreateClmmpoolParams, CreateTickArrayParams } from "../../src";
import { ClmmpoolContext, ClmmpoolIx } from "../../src";
import { MathUtil } from "../../src/math/utils";
import type { TickArrayData } from "../../src/types";
import { confirmTx, loadProvider, parseMessage, TickSpacing } from "../utils";
import { createTestPool } from "../utils/init-utils";
import { generateDefaultInitTickArrayParams } from "../utils/test-builders";
import { ONE_SOL } from "../utils/test-consts";

describe("create_tick_array", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully create a TickArray account", async () => {
    const { poolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Standard,
      MathUtil.toX64_BN(new anchor.BN(10))
    );

    await fetcher.getPool(poolCreateInfo.clmmpool);

    const startTick = 1107; // Tick index must be >= 0 and <= 65535. Received -1

    const tickArrayInitInfo = generateDefaultInitTickArrayParams(
      ctx,
      poolCreateInfo.clmmpool,
      startTick
    );

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createTickArrayIx(ctx.program, {
        ...tickArrayInitInfo,
      }),
    ]);

    await confirmTx(tx);
    await assertTickArrayInitialized(
      ctx,
      tickArrayInitInfo,
      poolCreateInfo,
      startTick
    );
  });

  it("succeeds when funder is different than account paying for transaction fee", async () => {
    const payerKeypair = anchor.web3.Keypair.generate();
    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: payerKeypair.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const { poolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Standard,
      MathUtil.toX64_BN(new anchor.BN(10))
    );

    await fetcher.getPool(poolCreateInfo.clmmpool);

    const startTick = 1107; // Tick index must be >= 0 and <= 65535. Received -1

    const tickArrayInitInfo = generateDefaultInitTickArrayParams(
      ctx,
      poolCreateInfo.clmmpool,
      startTick,
      payerKeypair.publicKey
    );

    const tx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createTickArrayIx(ctx.program, {
          ...tickArrayInitInfo,
        }),
      ],
      [payerKeypair]
    );
    await confirmTx(tx);
    await assertTickArrayInitialized(
      ctx,
      tickArrayInitInfo,
      poolCreateInfo,
      startTick
    );
  });

  it("failed create a TickArray account with invalid start index", async () => {
    const { poolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Standard,
      MathUtil.toX64_BN(new anchor.BN(10))
    );

    await fetcher.getPool(poolCreateInfo.clmmpool);

    const startTick = 65535; // Tick index must be >= 0 and <= 65535. Received -1

    const tickArrayInitInfo = generateDefaultInitTickArrayParams(
      ctx,
      poolCreateInfo.clmmpool,
      startTick
    );

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createTickArrayIx(ctx.program, {
        ...tickArrayInitInfo,
      }),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6029", parseMessage((e as Error).message.toString()));
    }
  });

  async function assertTickArrayInitialized(
    ctx: ClmmpoolContext,
    tickArrayInitInfo: CreateTickArrayParams,
    poolInitInfo: CreateClmmpoolParams,
    startTick: number
  ) {
    const tickArrayData = (await fetcher.getTickArray(
      tickArrayInitInfo.tickArray
    )) as TickArrayData;
    assert.ok(tickArrayData.clmmpool.equals(poolInitInfo.clmmpool));
    assert.ok(tickArrayData.arrayIndex === startTick);
  }
});
