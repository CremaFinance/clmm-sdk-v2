import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import { u64 } from "@solana/spl-token";
import { BN } from "bn.js";
import { assert } from "chai";
import Decimal from "decimal.js";

import type { IncreaseLiquidityInputWithFixedToken } from "../../src";
import {
  ClmmpoolContext,
  ClmmpoolIx,
  createTickArrayRange,
  TickMath,
  TickUtil,
  toTokenAmount,
} from "../../src";
import { MathUtil } from "../../src/math/utils";
import type { PartnerData } from "../../src/types";
import { MAX_SQRT_PRICE } from "../../src/types";
import {
  confirmTx,
  createTokenAccount,
  loadProvider,
  parseMessage,
  TickSpacing,
} from "../utils";
import { ClmmpoolTestFixture } from "../utils/fixture";
import { createTestPool, createTestTickArrayMap } from "../utils/init-utils";
import { generateDefaultCreatePartnerParams } from "../utils/test-builders";
import { ZERO_BN } from "../utils/test-consts";

describe("swap_with_partner", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("fail on token vault mint does not match whirlpool token", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 0,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: 2,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      configCreateInfo,
      configKeypairs,
      positions,
      tokenAccountA,
      tokenAccountB,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(167_000, 167_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(increaseLiquidityTx);

    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configCreateInfo.clmmConfig,
      configCreateInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(1693880000), //2022-09-05 12:00:00
      new BN(1693886400), //2023-09-05 12:00:00
      "test"
    );

    const partnerTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [configKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(partnerTx);

    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);

    const partnerTokenAAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenA,
      partnerInitInfo.partner
    );

    const partnerTokenBAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenB,
      partnerInitInfo.partner
    );

    const arrayIndex = TickUtil.getArrayIndex(currentTick, 2);

    const remain_accounts = await createTickArrayRange(
      ctx,
      ctx.program.programId,
      clmmpool,
      arrayIndex,
      3,
      true
    );

    // fail on token vault mint a does not match whirlpool token a
    const tx01 = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.swapWithPartnerIx(ctx.program, {
        aToB: true,
        byAmountIn: true,
        amount: new u64(10),
        amountLimit: new u64(0),
        sqrtPriceLimit: new BN(4295048016), // MIN_SQRT_PRICE
        clmmConfig: configCreateInfo.clmmConfig,
        clmmpool,
        tokenA: poolCreateInfo.tokenA,
        tokenB: poolCreateInfo.tokenB,
        accountA: tokenAccountA,
        accountB: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenBVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayMap,
        owner: provider.wallet.publicKey,
        partner: partnerInitInfo.partner,
        partnerAtaA: partnerTokenAAccount,
        partnerAtaB: partnerTokenBAccount,
        tickArrays: remain_accounts,
      }),
    ]);

    try {
      await confirmTx(tx01);
    } catch (e) {
      assert.equal("6020", parseMessage((e as Error).message.toString()));
    }

    // fail on token vault mint b does not match whirlpool token b
    const tx02 = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.swapWithPartnerIx(ctx.program, {
        aToB: true,
        byAmountIn: true,
        amount: new u64(10),
        amountLimit: new u64(0),
        sqrtPriceLimit: new BN(4295048016), // MIN_SQRT_PRICE
        clmmConfig: configCreateInfo.clmmConfig,
        clmmpool,
        tokenA: poolCreateInfo.tokenA,
        tokenB: poolCreateInfo.tokenB,
        accountA: tokenAccountA,
        accountB: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenAVault,
        tickArrayMap,
        owner: provider.wallet.publicKey,
        partner: partnerInitInfo.partner,
        partnerAtaA: partnerTokenAAccount,
        partnerAtaB: partnerTokenBAccount,
        tickArrays: remain_accounts,
      }),
    ]);

    try {
      await confirmTx(tx02);
    } catch (e) {
      assert.equal("6020", parseMessage((e as Error).message.toString()));
    }
  });

  it("fail on token owner account does not match vault mint", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 0,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: 2,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      configCreateInfo,
      configKeypairs,
      positions,
      tokenAccountA,
      tokenAccountB,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(167_000, 167_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(increaseLiquidityTx);

    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configCreateInfo.clmmConfig,
      configCreateInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(1693880000), //2022-09-05 12:00:00
      new BN(1693886400), //2023-09-05 12:00:00
      "test"
    );

    const partnerTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [configKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(partnerTx);

    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);

    const partnerTokenAAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenA,
      partnerInitInfo.partner
    );

    const partnerTokenBAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenB,
      partnerInitInfo.partner
    );

    const arrayIndex = TickUtil.getArrayIndex(currentTick, 2);

    const remain_accounts = await createTickArrayRange(
      ctx,
      ctx.program.programId,
      clmmpool,
      arrayIndex,
      3,
      true
    );

    // fail on token owner account a does not match vault a mint
    const tx01 = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.swapWithPartnerIx(ctx.program, {
        aToB: true,
        byAmountIn: true,
        amount: new u64(10),
        amountLimit: new u64(0),
        sqrtPriceLimit: new BN(4295048016), // MIN_SQRT_PRICE
        clmmConfig: configCreateInfo.clmmConfig,
        clmmpool,
        tokenA: poolCreateInfo.tokenA,
        tokenB: poolCreateInfo.tokenB,
        accountA: tokenAccountB,
        accountB: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenBVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayMap,
        owner: provider.wallet.publicKey,
        partner: partnerInitInfo.partner,
        partnerAtaA: partnerTokenAAccount,
        partnerAtaB: partnerTokenBAccount,
        tickArrays: remain_accounts,
      }),
    ]);

    try {
      await confirmTx(tx01);
    } catch (e) {
      assert.equal("6021", parseMessage((e as Error).message.toString()));
    }

    // fail on token owner account b does not match vault b mint
    const tx02 = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.swapWithPartnerIx(ctx.program, {
        aToB: true,
        byAmountIn: true,
        amount: new u64(10),
        amountLimit: new u64(0),
        sqrtPriceLimit: new BN(4295048016), // MIN_SQRT_PRICE
        clmmConfig: configCreateInfo.clmmConfig,
        clmmpool,
        tokenA: poolCreateInfo.tokenA,
        tokenB: poolCreateInfo.tokenB,
        accountA: tokenAccountA,
        accountB: tokenAccountA,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenAVault,
        tickArrayMap,
        owner: provider.wallet.publicKey,
        partner: partnerInitInfo.partner,
        partnerAtaA: partnerTokenAAccount,
        partnerAtaB: partnerTokenBAccount,
        tickArrays: remain_accounts,
      }),
    ]);

    try {
      await confirmTx(tx02);
    } catch (e) {
      assert.equal("6021", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails to swap with incorrect token authority", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 0,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: 2,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      configCreateInfo,
      configKeypairs,
      positions,
      tokenAccountA,
      tokenAccountB,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(167_000, 167_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(increaseLiquidityTx);

    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configCreateInfo.clmmConfig,
      configCreateInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(1693880000), //2022-09-05 12:00:00
      new BN(1693886400), //2023-09-05 12:00:00
      "test"
    );

    const partnerTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [configKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(partnerTx);

    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);

    const partnerTokenAAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenA,
      partnerInitInfo.partner
    );

    const partnerTokenBAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenB,
      partnerInitInfo.partner
    );

    const otherTokenAuthority = anchor.web3.Keypair.generate();

    const arrayIndex = TickUtil.getArrayIndex(currentTick, 2);

    const remain_accounts = await createTickArrayRange(
      ctx,
      ctx.program.programId,
      clmmpool,
      arrayIndex,
      3,
      true
    );

    // fail on token vault mint a does not match whirlpool token a
    const tx = new TransactionEnvelope(
      ctx.provider,
      [
        ClmmpoolIx.swapWithPartnerIx(ctx.program, {
          aToB: true,
          byAmountIn: true,
          amount: new u64(10),
          amountLimit: new u64(0),
          sqrtPriceLimit: new BN(4295048016), // MIN_SQRT_PRICE
          clmmConfig: configCreateInfo.clmmConfig,
          clmmpool,
          tokenA: poolCreateInfo.tokenA,
          tokenB: poolCreateInfo.tokenB,
          accountA: tokenAccountA,
          accountB: tokenAccountB,
          tokenAVault: poolCreateInfo.tokenAVault,
          tokenBVault: poolCreateInfo.tokenBVault,
          tickArrayMap,
          owner: otherTokenAuthority.publicKey,
          partner: partnerInitInfo.partner,
          partnerAtaA: partnerTokenAAccount,
          partnerAtaB: partnerTokenBAccount,
          tickArrays: remain_accounts,
        }),
      ],
      [otherTokenAuthority]
    );

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6017", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails on passing in the wrong tick-array", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 0,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: 2,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      configCreateInfo,
      configKeypairs,
      positions,
      tokenAccountA,
      tokenAccountB,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(167_000, 167_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(increaseLiquidityTx);

    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configCreateInfo.clmmConfig,
      configCreateInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(1693880000), //2022-09-05 12:00:00
      new BN(1693886400), //2023-09-05 12:00:00
      "test"
    );

    const partnerTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [configKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(partnerTx);

    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);

    const partnerTokenAAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenA,
      partnerInitInfo.partner
    );

    const partnerTokenBAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenB,
      partnerInitInfo.partner
    );

    const arrayIndex = TickUtil.getArrayIndex(currentTick, 2);

    const remain_accounts = await createTickArrayRange(
      ctx,
      ctx.program.programId,
      clmmpool,
      arrayIndex,
      3,
      true
    );

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.swapWithPartnerIx(ctx.program, {
        aToB: true,
        byAmountIn: true,
        amount: new u64(10),
        amountLimit: new u64(0),
        sqrtPriceLimit: new BN(4295048016), // MIN_SQRT_PRICE
        clmmConfig: configCreateInfo.clmmConfig,
        clmmpool,
        tokenA: poolCreateInfo.tokenA,
        tokenB: poolCreateInfo.tokenB,
        accountA: tokenAccountA,
        accountB: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayMap,
        owner: provider.wallet.publicKey,
        partner: partnerInitInfo.partner,
        partnerAtaA: partnerTokenAAccount,
        partnerAtaB: partnerTokenBAccount,
        tickArrays: remain_accounts,
      }),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6030", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails on passing in the wrong clmmpool", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 0,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: 2,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      configCreateInfo,
      configKeypairs,
      positions,
      tokenAccountA,
      tokenAccountB,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(167_000, 167_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(increaseLiquidityTx);

    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configCreateInfo.clmmConfig,
      configCreateInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(1693880000), //2022-09-05 12:00:00
      new BN(1693886400), //2023-09-05 12:00:00
      "test"
    );

    const partnerTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [configKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(partnerTx);

    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);

    const partnerTokenAAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenA,
      partnerInitInfo.partner
    );

    const partnerTokenBAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenB,
      partnerInitInfo.partner
    );

    const price = MathUtil.toX64(new Decimal(10));
    const { poolCreateInfo: anotherPoolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Standard,
      price
    );

    const arrayIndex = TickUtil.getArrayIndex(currentTick, 2);

    const remain_accounts = await createTickArrayRange(
      ctx,
      ctx.program.programId,
      clmmpool,
      arrayIndex,
      3,
      true
    );

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.swapWithPartnerIx(ctx.program, {
        aToB: true,
        byAmountIn: true,
        amount: new u64(10),
        amountLimit: new u64(0),
        sqrtPriceLimit: new BN(4295048016), // MIN_SQRT_PRICE
        clmmConfig: configCreateInfo.clmmConfig,
        clmmpool: anotherPoolCreateInfo.clmmpool,
        tokenA: poolCreateInfo.tokenA,
        tokenB: poolCreateInfo.tokenB,
        accountA: tokenAccountA,
        accountB: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayMap,
        owner: provider.wallet.publicKey,
        partner: partnerInitInfo.partner,
        partnerAtaA: partnerTokenAAccount,
        partnerAtaB: partnerTokenBAccount,
        tickArrays: remain_accounts,
      }),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6020", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails on passing in the tick-array-map from another whirlpool", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 0,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: 2,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      configCreateInfo,
      configKeypairs,
      positions,
      tokenAccountA,
      tokenAccountB,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(167_000, 167_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(increaseLiquidityTx);

    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configCreateInfo.clmmConfig,
      configCreateInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(1693880000), //2022-09-05 12:00:00
      new BN(1693886400), //2023-09-05 12:00:00
      "test"
    );

    const partnerTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [configKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(partnerTx);

    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);

    const partnerTokenAAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenA,
      partnerInitInfo.partner
    );

    const partnerTokenBAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenB,
      partnerInitInfo.partner
    );

    const price = MathUtil.toX64(new Decimal(10));
    const { poolCreateInfo: anotherPoolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Standard,
      price
    );
    const anotherTickArrayMap = await createTestTickArrayMap(
      ctx,
      anotherPoolCreateInfo.clmmpool
    );

    const arrayIndex = TickUtil.getArrayIndex(currentTick, 2);

    const remain_accounts = await createTickArrayRange(
      ctx,
      ctx.program.programId,
      clmmpool,
      arrayIndex,
      3,
      true
    );

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.swapWithPartnerIx(ctx.program, {
        aToB: true,
        byAmountIn: true,
        amount: new u64(0),
        amountLimit: new u64(0),
        sqrtPriceLimit: new BN(4295048016),
        clmmConfig: configCreateInfo.clmmConfig,
        clmmpool,
        tokenA: poolCreateInfo.tokenA,
        tokenB: poolCreateInfo.tokenB,
        accountA: tokenAccountA,
        accountB: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayMap: anotherTickArrayMap.tickArrayMap,
        owner: provider.wallet.publicKey,
        partner: partnerInitInfo.partner,
        partnerAtaA: partnerTokenAAccount,
        partnerAtaB: partnerTokenBAccount,
        tickArrays: remain_accounts,
      }),
    ]);

    // Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("2006", parseMessage((e as Error).message.toString()));
    }
  });

  it("Error if sqrt_price_limit exceeds min", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 0,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: 2,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      configCreateInfo,
      configKeypairs,
      positions,
      tokenAccountA,
      tokenAccountB,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(167_000, 167_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(increaseLiquidityTx);

    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configCreateInfo.clmmConfig,
      configCreateInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(1693880000), //2022-09-05 12:00:00
      new BN(1693886400), //2023-09-05 12:00:00
      "test"
    );

    const partnerTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [configKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(partnerTx);

    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);

    const partnerTokenAAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenA,
      partnerInitInfo.partner
    );

    const partnerTokenBAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenB,
      partnerInitInfo.partner
    );

    const arrayIndex = TickUtil.getArrayIndex(currentTick, 2);

    const remain_accounts = await createTickArrayRange(
      ctx,
      ctx.program.programId,
      clmmpool,
      arrayIndex,
      3,
      true
    );

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.swapWithPartnerIx(ctx.program, {
        aToB: true,
        byAmountIn: true,
        amount: new u64(10),
        amountLimit: new u64(0),
        sqrtPriceLimit: new BN(4295048015), // MIN_SQRT_PRICE - 1
        clmmConfig: configCreateInfo.clmmConfig,
        clmmpool,
        tokenA: poolCreateInfo.tokenA,
        tokenB: poolCreateInfo.tokenB,
        accountA: tokenAccountA,
        accountB: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayMap,
        owner: provider.wallet.publicKey,
        partner: partnerInitInfo.partner,
        partnerAtaA: partnerTokenAAccount,
        partnerAtaB: partnerTokenBAccount,
        tickArrays: remain_accounts,
      }),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6027", parseMessage((e as Error).message.toString()));
    }
  });

  it("Error if sqrt_price_limit exceeds max", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 0,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: 2,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      configCreateInfo,
      configKeypairs,
      positions,
      tokenAccountA,
      tokenAccountB,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(167_000, 167_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(increaseLiquidityTx);

    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configCreateInfo.clmmConfig,
      configCreateInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(1693880000), //2022-09-05 12:00:00
      new BN(1693886400), //2023-09-05 12:00:00
      "test"
    );

    const partnerTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [configKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(partnerTx);

    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);

    const partnerTokenAAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenA,
      partnerInitInfo.partner
    );

    const partnerTokenBAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenB,
      partnerInitInfo.partner
    );

    const arrayIndex = TickUtil.getArrayIndex(currentTick, 2);

    const remain_accounts = await createTickArrayRange(
      ctx,
      ctx.program.programId,
      clmmpool,
      arrayIndex,
      3,
      true
    );

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.swapWithPartnerIx(ctx.program, {
        aToB: false,
        byAmountIn: true,
        amount: new u64(10),
        amountLimit: new u64(0),
        sqrtPriceLimit: new BN(MAX_SQRT_PRICE).add(new BN(1)),
        clmmConfig: configCreateInfo.clmmConfig,
        clmmpool,
        tokenA: poolCreateInfo.tokenA,
        tokenB: poolCreateInfo.tokenB,
        accountA: tokenAccountA,
        accountB: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayMap,
        owner: provider.wallet.publicKey,
        partner: partnerInitInfo.partner,
        partnerAtaA: partnerTokenAAccount,
        partnerAtaB: partnerTokenBAccount,
        tickArrays: remain_accounts,
      }),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6027", parseMessage((e as Error).message.toString()));
    }
  });

  it("Error if b to a swap below minimum output", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: 2,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      configCreateInfo,
      configKeypairs,
      positions,
      tokenAccountA,
      tokenAccountB,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(167_000, 167_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(increaseLiquidityTx);

    console.log(poolCreateInfo.tokenAVault.toString(), "VaultA##");
    console.log(poolCreateInfo.tokenBVault.toString(), "VaultA##");

    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configCreateInfo.clmmConfig,
      configCreateInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(1693880000), //2022-09-05 12:00:00
      new BN(1693886400), //2023-09-05 12:00:00
      "test"
    );

    const partnerTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [configKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(partnerTx);

    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);

    const partnerTokenAAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenA,
      partnerInitInfo.partner
    );

    const partnerTokenBAccount = await createTokenAccount(
      provider,
      poolCreateInfo.tokenB,
      partnerInitInfo.partner
    );

    const arrayIndex = TickUtil.getArrayIndex(currentTick, 2);

    const remain_accounts = await createTickArrayRange(
      ctx,
      ctx.program.programId,
      clmmpool,
      arrayIndex,
      3,
      true
    );

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.swapWithPartnerIx(ctx.program, {
        aToB: true,
        byAmountIn: true,
        amount: new u64(100),
        amountLimit: new u64(0),
        sqrtPriceLimit: new BN(4295048016),
        clmmConfig: configCreateInfo.clmmConfig,
        clmmpool,
        tokenA: poolCreateInfo.tokenA,
        tokenB: poolCreateInfo.tokenB,
        accountA: tokenAccountA,
        accountB: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayMap,
        owner: provider.wallet.publicKey,
        partner: partnerInitInfo.partner,
        partnerAtaA: partnerTokenAAccount,
        partnerAtaB: partnerTokenBAccount,
        tickArrays: remain_accounts,
      }),
    ]);

    await confirmTx(tx);
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6027", parseMessage((e as Error).message.toString()));
    }
  });
});
