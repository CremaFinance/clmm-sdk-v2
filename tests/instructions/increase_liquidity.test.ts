import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import { u64 } from "@solana/spl-token";
import { BN } from "bn.js";
import { assert } from "chai";

import type {
  CreateClmmpoolParams,
  CreateTickArrayMapParams,
  IncreaseLiquidityInputWithFixedToken,
} from "../../src";
import {
  ClmmpoolContext,
  ClmmpoolIx,
  ClmmPoolUtil,
  TickMath,
  TickUtil,
  toTokenAmount,
} from "../../src";
import type {
  ClmmpoolData,
  PositionData,
  TickArrayData,
} from "../../src/types";
import {
  approveToken,
  confirmTx,
  createAndMintToTokenAccount,
  createMint,
  createTokenAccount,
  getTokenBalance,
  loadProvider,
  parseMessage,
  TickSpacing,
  transfer,
} from "../utils";
import { assertTick } from "../utils/assert";
import { ClmmpoolTestFixture } from "../utils/fixture";
import {
  createTestPool,
  createTestTickArrayMap,
  initTickArray,
  openTestPosition,
} from "../utils/init-utils";
import { generateDefaultInitTickArrayParams } from "../utils/test-builders";
import { MAX_U64, ZERO_BN } from "../utils/test-consts";

describe("increase_liquidity", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  let poolInfo: CreateClmmpoolParams;
  let tickArrayMap: CreateTickArrayMapParams;

  it("increase liquidity of a position spanning two tick arrays", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const { poolCreateInfo, positions, tokenAccountA, tokenAccountB } =
      fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);
    tickArrayMap = tickArrayMapInfo;
    const { openPositionParams } = positions[0]!;
    const poolBefore = (await fetcher.getPool(clmmpool, true)) as ClmmpoolData;
    const tokenAmounts = toTokenAmount(167_000, 167_000);
    const liquidityAmount = ClmmPoolUtil.estimateLiquidityFromTokenAmounts(
      new BN(currentTick),
      tickLowerIndex,
      tickUpperIndex,
      tokenAmounts
    );

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
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);
    await confirmTx(increaseLiquidityTx);

    const position = (await fetcher.getPosition(
      openPositionParams.position,
      true
    )) as PositionData;
    assert.ok(position.liquidity.eq(liquidityAmount));

    const poolAfter = (await fetcher.getPool(clmmpool, true)) as ClmmpoolData;
    assert.ok(
      poolAfter.rewarderLastUpdatedTime.gte(poolBefore.rewarderLastUpdatedTime)
    );

    assert.equal(
      await getTokenBalance(provider, poolCreateInfo.tokenAVault),
      tokenAmounts.tokenA.toString()
    );
    assert.equal(
      await getTokenBalance(provider, poolCreateInfo.tokenBVault),
      tokenAmounts.tokenA.toString()
    );
    assert.ok(poolAfter.liquidity.eq(new anchor.BN(liquidityAmount)));

    const tickArrayLower = (await fetcher.getTickArray(
      positions[0]!.tickArrayLower,
      true
    )) as TickArrayData;
    assertTick(
      tickArrayLower.ticks[64]!,
      true,
      liquidityAmount,
      liquidityAmount
    );
    const tickArrayUpper = (await fetcher.getTickArray(
      positions[0]!.tickArrayUpper,
      true
    )) as TickArrayData;
    assertTick(
      tickArrayUpper.ticks[0]!,
      true,
      liquidityAmount,
      liquidityAmount.neg()
    );
  });

  it("increase liquidity of a position contained in one tick array", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 1280,
      tickUpperIndex = 12800;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const { poolCreateInfo, positions, tokenAccountA, tokenAccountB } =
      fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);
    tickArrayMap = tickArrayMapInfo;
    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(167_000, 0);
    const liquidityAmount = ClmmPoolUtil.estimateLiquidityFromTokenAmounts(
      new BN(currentTick),
      tickLowerIndex,
      tickUpperIndex,
      tokenAmounts
    );

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
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    await confirmTx(increaseLiquidityTx);

    assert.equal(
      await getTokenBalance(provider, poolCreateInfo.tokenAVault),
      tokenAmounts.tokenA.toString()
    );

    assert.equal(
      await getTokenBalance(provider, poolCreateInfo.tokenBVault),
      tokenAmounts.tokenB.toString()
    );

    const expectedLiquidity = new anchor.BN(liquidityAmount);
    const position = (await fetcher.getPosition(
      openPositionParams.position,
      true
    )) as PositionData;
    assert.ok(position.liquidity.eq(expectedLiquidity));

    const tickArray = (await fetcher.getTickArray(
      positions[0]!.tickArrayLower,
      true
    )) as TickArrayData;
    assertTick(
      tickArray.ticks[64]!,
      true,
      expectedLiquidity,
      expectedLiquidity.neg()
    );

    const poolAfter = (await fetcher.getPool(
      poolCreateInfo.clmmpool,
      true
    )) as ClmmpoolData;

    assert.equal(poolAfter.liquidity, new anchor.BN(0));
  });

  it("initialize and increase liquidity of a position in a single transaction", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const { poolCreateInfo, positions, tokenAccountA, tokenAccountB } =
      fixture.getInfos();
    const { clmmpool, tickSpacing } = poolCreateInfo;

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);
    tickArrayMap = tickArrayMapInfo;
    const { openPositionParams } = positions[0]!;
    const tokenAmounts = toTokenAmount(1_000_000, 0);

    const tickArrayParams = generateDefaultInitTickArrayParams(
      ctx,
      clmmpool,
      TickUtil.getArrayIndex(tickLowerIndex, tickSpacing)
    );

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const txs = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.createTickArrayIx(ctx.program, tickArrayParams),
      ClmmpoolIx.openPositionIx(ctx.program, openPositionParams),
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
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
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    await confirmTx(txs);
  });

  it("increase liquidity of a position with an approved position authority delegate", async () => {
    // create a test pool
    const currentTick = 1300;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const { poolCreateInfo, positions, tokenAccountA, tokenAccountB } =
      fixture.getInfos();
    const { clmmpool } = poolCreateInfo;

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);
    tickArrayMap = tickArrayMapInfo;
    const { openPositionParams } = positions[0]!;
    const poolBefore = (await fetcher.getPool(clmmpool, true)) as ClmmpoolData;
    const tokenAmounts = toTokenAmount(167_000, 0);
    const liquidityAmount = ClmmPoolUtil.estimateLiquidityFromTokenAmounts(
      new BN(currentTick),
      tickLowerIndex,
      tickUpperIndex,
      tokenAmounts
    );

    const delegate = anchor.web3.Keypair.generate();

    await approveToken(provider, poolCreateInfo.tokenA, delegate.publicKey, 1);
    await approveToken(provider, tokenAccountA, delegate.publicKey, 1_000_000);
    await approveToken(provider, tokenAccountB, delegate.publicKey, 1_000_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
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
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    await confirmTx(increaseLiquidityTx);

    assert.equal(
      await getTokenBalance(provider, poolCreateInfo.tokenAVault),
      tokenAmounts.tokenA.toString()
    );

    assert.equal(
      await getTokenBalance(provider, poolCreateInfo.tokenBVault),
      tokenAmounts.tokenB.toString()
    );

    const expectedLiquidity = new anchor.BN(liquidityAmount);
    const position = (await fetcher.getPosition(
      openPositionParams.position,
      true
    )) as PositionData;
    assert.ok(position.liquidity.eq(expectedLiquidity));

    const tickArray = (await fetcher.getTickArray(
      positions[0]!.tickArrayLower,
      true
    )) as TickArrayData;

    assertTick(
      tickArray.ticks[64]!,
      true,
      expectedLiquidity,
      expectedLiquidity.neg()
    );

    const poolAfter = (await fetcher.getPool(
      poolCreateInfo.clmmpool,
      true
    )) as ClmmpoolData;
    assert.ok(
      poolAfter.rewarderLastUpdatedTime.gte(poolBefore.rewarderLastUpdatedTime)
    );
    assert.equal(poolAfter.liquidity, new anchor.BN(0));
  });

  it("add maximum amount of liquidity near minimum price", async () => {
    // create a test pool
    const currentTick = -443621;
    const tickLowerIndex = -443632,
      tickUpperIndex = -443624;
    const { poolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Stable,
      TickMath.tickIndexToSqrtPriceX64(currentTick)
    );

    const { tokenA, tokenB, clmmpool } = poolCreateInfo;
    const tokenAccountA = await createAndMintToTokenAccount(
      provider,
      tokenA,
      MAX_U64
    );

    const tokenAccountB = await createAndMintToTokenAccount(
      provider,
      tokenB,
      MAX_U64
    );

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);

    const {
      params: { tickArray },
    } = await initTickArray(ctx, clmmpool, -443624);

    const openPositionInfo = await openTestPosition(
      ctx,
      clmmpool,
      tickLowerIndex,
      tickUpperIndex
    );

    const { position, positionAta } = openPositionInfo.params;

    const tokenAmounts = {
      tokenA: new u64(0),
      tokenB: MAX_U64,
    };

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position,
        positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: tickArray,
        tickArrayUpper: tickArray,
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    await confirmTx(increaseLiquidityTx);
  });

  it("add maximum amount of liquidity near minimum price", async () => {
    // create a test pool
    const currentTick = 443635;
    const tickLowerIndex = 436488,
      tickUpperIndex = 436496;
    const { poolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Stable,
      TickMath.tickIndexToSqrtPriceX64(currentTick)
    );

    const { tokenA, tokenB, clmmpool } = poolCreateInfo;
    const tokenAccountA = await createAndMintToTokenAccount(
      provider,
      tokenA,
      MAX_U64
    );

    const tokenAccountB = await createAndMintToTokenAccount(
      provider,
      tokenB,
      MAX_U64
    );

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);

    const {
      params: { tickArray },
    } = await initTickArray(ctx, clmmpool, 436480);

    const openPositionInfo = await openTestPosition(
      ctx,
      clmmpool,
      tickLowerIndex,
      tickUpperIndex
    );

    const { position, positionAta } = openPositionInfo.params;

    const tokenAmounts = {
      tokenA: new u64(0),
      tokenB: MAX_U64,
    };

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const increaseLiquidityTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position,
        positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: tickArray,
        tickArrayUpper: tickArray,
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    await confirmTx(increaseLiquidityTx);
  });

  it("fails with zero liquidity amount", async () => {
    // create a test pool
    const currentTick = 0;
    const tickLowerIndex = 7168,
      tickUpperIndex = 8960;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const { poolCreateInfo, positions, tokenAccountA, tokenAccountB } =
      fixture.getInfos();
    const { clmmpool } = poolCreateInfo;
    const { openPositionParams } = positions[0]!;

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);
    const tokenAmounts = toTokenAmount(0, 1_000_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
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
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    //Error Code: InvalidDeltaLiquidity. Error Number: 6025. Error Message: Invalid delta liquidity.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6025", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when token max a exceeded", async () => {
    // create a test pool
    const currentTick = 1;
    const tickLowerIndex = 7168,
      tickUpperIndex = 8960;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const { poolCreateInfo, positions, tokenAccountA, tokenAccountB } =
      fixture.getInfos();
    const { clmmpool } = poolCreateInfo;
    const { openPositionParams } = positions[0]!;

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);
    const tokenAmounts = toTokenAmount(0, 999_999_999);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
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
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    // Error Code: TokenAmountMaxExceeded. Error Number: 6007. Error Message: Token amount max exceeded.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6007", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when token max a exceeded", async () => {
    // create a test pool
    const currentTick = 1;
    const tickLowerIndex = 7168,
      tickUpperIndex = 8960;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const { poolCreateInfo, positions, tokenAccountA, tokenAccountB } =
      fixture.getInfos();
    const { clmmpool } = poolCreateInfo;
    const { openPositionParams } = positions[0]!;

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);
    const tokenAmounts = toTokenAmount(999_999_999, 0);
    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
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
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    // Error Code: TokenAmountMaxExceeded. Error Number: 6007. Error Message: Token amount max exceeded.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6007", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when position account does not have exactly 1 token", async () => {
    // create a test pool
    const tickLowerIndex = 7168,
      tickUpperIndex = 8960;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
    });

    const { poolCreateInfo, positions, tokenAccountA, tokenAccountB } =
      fixture.getInfos();
    const { clmmpool } = poolCreateInfo;
    const { openPositionParams } = positions[0]!;

    // Create a position token account that contains 0 tokens
    const newPositionTokenAccount = await createTokenAccount(
      provider,
      openPositionParams.positionNftMint,
      provider.wallet.publicKey
    );

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);
    const tokenAmounts = toTokenAmount(0, 1_000_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: newPositionTokenAccount,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6024", parseMessage((e as Error).message.toString()));
    }

    // Send position token to other position token account
    await transfer(
      provider,
      openPositionParams.positionAta,
      newPositionTokenAccount,
      1
    );

    const tx_1 = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
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
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    // Error Code: TokenAmountMaxExceeded. Error Number: 6007. Error Message: Token amount max exceeded.
    try {
      await confirmTx(tx_1);
    } catch (e) {
      assert.equal("6024", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when position token account mint does not match position mint", async () => {
    // create a test pool
    const tickLowerIndex = 7168,
      tickUpperIndex = 8960;
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
    });

    const { poolCreateInfo, positions, tokenAccountA, tokenAccountB } =
      fixture.getInfos();
    const { clmmpool } = poolCreateInfo;
    const { openPositionParams } = positions[0]!;

    // Create a position token account that contains 0 tokens
    const newPositionTokenAccount = await createTokenAccount(
      provider,
      openPositionParams.positionNftMint,
      provider.wallet.publicKey
    );

    const tickArrayMapInfo = await createTestTickArrayMap(ctx, clmmpool);
    const tokenAmounts = toTokenAmount(0, 1_000_000);

    const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken = {
      tokenA: tokenAmounts.tokenA,
      tokenB: tokenAmounts.tokenB,
      isAFixed: true,
    };

    // Create a position token account that contains 0 tokens
    const invalidMint = await createMint(provider);
    const invalidPositionTokenAccount = await createAndMintToTokenAccount(
      provider,
      invalidMint,
      1
    );

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
        liquidityInputWithFixedToken,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: invalidPositionTokenAccount,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: poolCreateInfo.tokenAVault,
        tokenBVault: poolCreateInfo.tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    // Error Code: TokenAmountMaxExceeded. Error Number: 6007. Error Message: Token amount max exceeded.
    await confirmTx(tx);
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6007", parseMessage((e as Error).message.toString()));
    }

    // Send position token to other position token account
    await transfer(
      provider,
      openPositionParams.positionAta,
      newPositionTokenAccount,
      1
    );

    const tx_1 = new TransactionEnvelope(provider, [
      ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
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
        tickArrayMap: tickArrayMapInfo.tickArrayMap,
      }),
    ]);

    // Error Code: TokenAmountMaxExceeded. Error Number: 6007. Error Message: Token amount max exceeded.
    await confirmTx(tx_1);
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6007", parseMessage((e as Error).message.toString()));
    }
  });
});
