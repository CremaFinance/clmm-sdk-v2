import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import { assert } from "chai";
import Decimal from "../../src/utils/decimal";

import type { CreateClmmpoolParams } from "../../src";
import { ClmmpoolContext, ClmmpoolIx, PDAUtil } from "../../src";
import { TickMath } from "../../src/math/tick";
import { MathUtil } from "../../src/math/utils";
import type { ClmmpoolData } from "../../src/types";
import { MAX_SQRT_PRICE, MIN_SQRT_PRICE } from "../../src/types";
import { createMint, TickSpacing } from "../utils";
import { asyncAssertTokenVault } from "../utils/assert";
import { buildTestPoolParams, createTestPool } from "../utils/init-utils";
import { ONE_SOL, ZERO_BN } from "../utils/test-consts";
import { confirmTx, loadProvider, parseMessage } from "../utils/utils";

describe("create_clmmpool", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully create a Standard clmmpool", async () => {
    const price = MathUtil.toX64(new Decimal(5));
    const { configCreateInfo, poolCreateInfo, feeTierParams } =
      await createTestPool(ctx, TickSpacing.Standard, price);

    const clmmpool = (await fetcher.getPool(
      poolCreateInfo.clmmpool
    )) as ClmmpoolData;

    const exportedClmmpoolPDA = PDAUtil.getClmmpoolPDA(
      program.programId,
      configCreateInfo.clmmConfig,
      poolCreateInfo.tokenA,
      poolCreateInfo.tokenB,
      TickSpacing.Standard
    );

    assert.ok(poolCreateInfo.clmmpool.equals(exportedClmmpoolPDA.publicKey));
    assert.equal(exportedClmmpoolPDA.bump, clmmpool.bump[0]);

    assert.ok(clmmpool.clmmConfig.equals(poolCreateInfo.clmmConfig));
    assert.ok(clmmpool.tokenA.equals(poolCreateInfo.tokenA));
    assert.ok(clmmpool.tokenAVault.equals(poolCreateInfo.tokenAVault));

    assert.ok(clmmpool.tokenB.equals(poolCreateInfo.tokenB));
    assert.ok(clmmpool.tokenBVault.equals(poolCreateInfo.tokenBVault));

    assert.equal(clmmpool.feeRate, feeTierParams.feeRate);

    assert.ok(
      clmmpool.currentSqrtPrice.eq(
        new anchor.BN(poolCreateInfo.initSqrtPrice.toString())
      )
    );
    assert.ok(clmmpool.liquidity.eq(ZERO_BN));

    assert.equal(
      clmmpool.currentTickIndex,
      TickMath.sqrtPriceX64ToTickIndex(poolCreateInfo.initSqrtPrice)
    );

    assert.ok(clmmpool.feeProtocolTokenA.eq(ZERO_BN));
    assert.ok(clmmpool.feeProtocolTokenB.eq(ZERO_BN));
    assert.ok(clmmpool.feeGrowthGlobalA.eq(ZERO_BN));
    assert.ok(clmmpool.feeGrowthGlobalB.eq(ZERO_BN));

    assert.ok(clmmpool.tickSpacing === TickSpacing.Standard);

    await asyncAssertTokenVault(program, poolCreateInfo.tokenAVault, {
      expectedOwner: poolCreateInfo.clmmpool,
      expectedMint: poolCreateInfo.tokenA,
    });
    await asyncAssertTokenVault(program, poolCreateInfo.tokenBVault, {
      expectedOwner: poolCreateInfo.clmmpool,
      expectedMint: poolCreateInfo.tokenB,
    });
  });

  it("successfully create a Stable clmmpool", async () => {
    const price = MathUtil.toX64(new Decimal(5));
    const { configCreateInfo, poolCreateInfo, feeTierParams } =
      await createTestPool(ctx, TickSpacing.Stable, price);

    const clmmpool = (await fetcher.getPool(
      poolCreateInfo.clmmpool
    )) as ClmmpoolData;

    const exportedClmmpoolPDA = PDAUtil.getClmmpoolPDA(
      program.programId,
      configCreateInfo.clmmConfig,
      poolCreateInfo.tokenA,
      poolCreateInfo.tokenB,
      TickSpacing.Stable
    );

    assert.ok(poolCreateInfo.clmmpool.equals(exportedClmmpoolPDA.publicKey));
    assert.equal(exportedClmmpoolPDA.bump, clmmpool.bump[0]);

    assert.ok(clmmpool.clmmConfig.equals(poolCreateInfo.clmmConfig));
    assert.ok(clmmpool.tokenA.equals(poolCreateInfo.tokenA));
    assert.ok(clmmpool.tokenAVault.equals(poolCreateInfo.tokenAVault));

    assert.ok(clmmpool.tokenB.equals(poolCreateInfo.tokenB));
    assert.ok(clmmpool.tokenBVault.equals(poolCreateInfo.tokenBVault));

    assert.equal(clmmpool.feeRate, feeTierParams.feeRate);

    assert.ok(
      clmmpool.currentSqrtPrice.eq(
        new anchor.BN(poolCreateInfo.initSqrtPrice.toString())
      )
    );
    assert.ok(clmmpool.liquidity.eq(ZERO_BN));

    assert.equal(
      clmmpool.currentTickIndex,
      TickMath.sqrtPriceX64ToTickIndex(poolCreateInfo.initSqrtPrice)
    );

    assert.ok(clmmpool.feeProtocolTokenA.eq(ZERO_BN));
    assert.ok(clmmpool.feeProtocolTokenB.eq(ZERO_BN));
    assert.ok(clmmpool.feeGrowthGlobalA.eq(ZERO_BN));
    assert.ok(clmmpool.feeGrowthGlobalB.eq(ZERO_BN));

    assert.ok(clmmpool.tickSpacing === TickSpacing.Stable);

    await asyncAssertTokenVault(program, poolCreateInfo.tokenAVault, {
      expectedOwner: poolCreateInfo.clmmpool,
      expectedMint: poolCreateInfo.tokenA,
    });
    await asyncAssertTokenVault(program, poolCreateInfo.tokenBVault, {
      expectedOwner: poolCreateInfo.clmmpool,
      expectedMint: poolCreateInfo.tokenB,
    });
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
    const _ = await confirmTx(systemTransferTx);
    await createTestPool(
      ctx,
      TickSpacing.Standard,
      MathUtil.toX64(new Decimal(5)),
      payerKeypair
    );
  });

  it("fails when tokenVaultA mint does not match tokenA mint", async () => {
    const { poolCreateInfo } = await buildTestPoolParams(
      ctx,
      TickSpacing.Standard
    );
    const otherTokenPublicKey = await createMint(provider);

    const modifiedPoolInitInfo: CreateClmmpoolParams = {
      ...poolCreateInfo,
      tokenA: otherTokenPublicKey,
    };

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createClmmpoolIx(ctx.program, modifiedPoolInitInfo),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal(
        "PrivilegeEscalation",
        (e as Error).message.substring(
          (e as Error).message.indexOf("[0,") + 4,
          (e as Error).message.indexOf("]}})") - 1
        )
      );
    }
  });

  it("fails when tokenVaultA mint does not match tokenB mint", async () => {
    const { poolCreateInfo } = await buildTestPoolParams(
      ctx,
      TickSpacing.Standard
    );
    const otherTokenPublicKey = await createMint(provider);

    const modifiedPoolInitInfo: CreateClmmpoolParams = {
      ...poolCreateInfo,
      tokenB: otherTokenPublicKey,
    };

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createClmmpoolIx(ctx.program, modifiedPoolInitInfo),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal(
        "PrivilegeEscalation",
        (e as Error).message.substring(
          (e as Error).message.indexOf("[0,") + 4,
          (e as Error).message.indexOf("]}})") - 1
        )
      );
    }
  });

  it("fails when token mints are in the wrong order", async () => {
    const { poolCreateInfo, configCreateInfo } = await buildTestPoolParams(
      ctx,
      TickSpacing.Standard
    );

    const clmmpoolPda = PDAUtil.getClmmpoolPDA(
      ctx.program.programId,
      configCreateInfo.clmmConfig,
      poolCreateInfo.tokenB,
      poolCreateInfo.tokenA,
      TickSpacing.Standard
    );

    const modifiedPoolInitInfo: CreateClmmpoolParams = {
      ...poolCreateInfo,
      clmmpool: clmmpoolPda.publicKey,
      tokenA: poolCreateInfo.tokenB,
      tokenB: poolCreateInfo.tokenA,
    };

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createClmmpoolIx(ctx.program, modifiedPoolInitInfo),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal(
        "MissingAccount",
        (e as Error).message.substring(
          (e as Error).message.indexOf("[0,") + 4,
          (e as Error).message.indexOf("]}})") - 1
        )
      );
    }
  });

  it("fails when the same token mint is passed in", async () => {
    const { poolCreateInfo, configCreateInfo } = await buildTestPoolParams(
      ctx,
      TickSpacing.Standard
    );

    const clmmpoolPda = PDAUtil.getClmmpoolPDA(
      ctx.program.programId,
      configCreateInfo.clmmConfig,
      poolCreateInfo.tokenA,
      poolCreateInfo.tokenA,
      TickSpacing.Standard
    );

    const modifiedPoolInitInfo: CreateClmmpoolParams = {
      ...poolCreateInfo,
      clmmpool: clmmpoolPda.publicKey,
      tokenB: poolCreateInfo.tokenA,
    };

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createClmmpoolIx(ctx.program, modifiedPoolInitInfo),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal(
        "MissingAccount",
        (e as Error).message.substring(
          (e as Error).message.indexOf("[0,") + 4,
          (e as Error).message.indexOf("]}})") - 1
        )
      );
    }
  });

  it("fails when sqrt-price exceeds max", async () => {
    const { poolCreateInfo } = await buildTestPoolParams(
      ctx,
      TickSpacing.Standard
    );

    const modifiedPoolInitInfo: CreateClmmpoolParams = {
      ...poolCreateInfo,
      initSqrtPrice: new anchor.BN(MAX_SQRT_PRICE).add(new anchor.BN(1)),
    };

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createClmmpoolIx(ctx.program, modifiedPoolInitInfo),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6008", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when sqrt-price subceeds min", async () => {
    const { poolCreateInfo } = await buildTestPoolParams(
      ctx,
      TickSpacing.Standard
    );

    const modifiedPoolInitInfo: CreateClmmpoolParams = {
      ...poolCreateInfo,
      initSqrtPrice: new anchor.BN(MIN_SQRT_PRICE).add(new anchor.BN(1)),
    };

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createClmmpoolIx(ctx.program, modifiedPoolInitInfo),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6008", parseMessage((e as Error).message.toString()));
    }
  });
});
