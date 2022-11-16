import * as anchor from "@project-serum/anchor";
import BN from "bn.js";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";

import { ClmmpoolContext, ClmmpoolIx } from "../../src";
import { MathUtil } from "../../src/math/utils";
import { confirmTx, loadProvider, TickSpacing } from "../utils";
import { createTestPool } from "../utils/init-utils";
import { generateDefaultInitTickArrayMapParams } from "../utils/test-builders";
import { ONE_SOL } from "../utils/test-consts";

describe("create_tick_array_map", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully create a TickArrayMap account", async () => {
    const { poolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Standard,
      MathUtil.toX64_BN(new BN(10))
    );

    await fetcher.getPool(poolCreateInfo.clmmpool);

    const tickArrayMapInitInfo = generateDefaultInitTickArrayMapParams(
      ctx,
      poolCreateInfo.clmmpool
    );

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createTickArrayMapIx(ctx.program, {
        ...tickArrayMapInitInfo,
      }),
    ]);
    await confirmTx(tx);
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

    const tickArrayMapInitInfo = generateDefaultInitTickArrayMapParams(
      ctx,
      poolCreateInfo.clmmpool,
      payerKeypair.publicKey
    );

    const tx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createTickArrayMapIx(ctx.program, {
          ...tickArrayMapInitInfo,
        }),
      ],
      [payerKeypair]
    );
    await confirmTx(tx);
  });
});
