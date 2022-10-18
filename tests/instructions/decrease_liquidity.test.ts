import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import type { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

import type { OpenPositionParams } from "../../src";
import {
  ClmmpoolContext,
  ClmmpoolIx,
  decreaseLiquidityQuoteByLiquidityWithParams,
  Percentage,
  TickMath,
} from "../../src";
import type { ClmmpoolData } from "../../src/types";
import {
  approveToken,
  confirmTx,
  createAndMintToTokenAccount,
  createTokenAccount,
  loadProvider,
  parseMessage,
  setAuthority,
  TickSpacing,
  transfer,
} from "../utils";
import { ClmmpoolTestFixture } from "../utils/fixture";
import { initTickArray } from "../utils/init-utils";

describe("decrease_liquidity", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  let createdPool0: OpenPositionParams;
  let lowerTickArray: PublicKey;
  let upperTickArray: PublicKey;
  let pool: PublicKey;

  it("successfully decrease liquidity from position in two tick arrays", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const poolBefore = (await fetcher.getPool(clmmpool, true)) as ClmmpoolData;
    const openPositionParams = positions[0]!.openPositionParams;
    createdPool0 = openPositionParams;
    pool = clmmpool;

    lowerTickArray = positions[0]!.tickArrayLower;
    upperTickArray = positions[0]!.tickArrayUpper;

    const removeQuote = decreaseLiquidityQuoteByLiquidityWithParams({
      liquidity: new anchor.BN(1_000_000),
      currentSqrtPrice: poolBefore.currentSqrtPrice,
      slippageToLerance: Percentage.fromFraction(1, 100),
      currentTickIndex: poolBefore.currentTickIndex,
      tickLowerIndex,
      tickUpperIndex,
    });

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(tx);

    const remainingLiquidity = liquidityAmount.sub(removeQuote.liquidityAmount);
    const poolAfter = (await fetcher.getPool(clmmpool, true)) as ClmmpoolData;
    assert.ok(poolAfter.liquidity.eq(remainingLiquidity));

    const position = await fetcher.getPosition(
      openPositionParams.position,
      true
    );
    assert.ok(position?.liquidity.eq(remainingLiquidity));
  });

  it("successfully decrease liquidity with approved delegate", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const poolBefore = (await fetcher.getPool(clmmpool, true)) as ClmmpoolData;
    const openPositionParams = positions[0]!.openPositionParams;

    const removeQuote = decreaseLiquidityQuoteByLiquidityWithParams({
      liquidity: new anchor.BN(1_000_000),
      currentSqrtPrice: poolBefore.currentSqrtPrice,
      slippageToLerance: Percentage.fromFraction(1, 100),
      currentTickIndex: poolBefore.currentTickIndex,
      tickLowerIndex,
      tickUpperIndex,
    });

    const delegate = anchor.web3.Keypair.generate();

    await approveToken(
      provider,
      positions[0]!.openPositionParams.positionAta,
      delegate.publicKey,
      1
    );
    await approveToken(provider, tokenAccountA, delegate.publicKey, 1_000_000);
    await approveToken(provider, tokenAccountB, delegate.publicKey, 1_000_000);

    await setAuthority(
      provider,
      tokenAccountA,
      delegate.publicKey,
      "AccountOwner"
    );

    await setAuthority(
      provider,
      tokenAccountB,
      delegate.publicKey,
      "AccountOwner"
    );

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const tx = new TransactionEnvelope(
      ctx.provider,
      [
        ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
          liquidityInput,
          owner: delegate.publicKey,
          clmmpool,
          position: openPositionParams.position,
          positionAta: openPositionParams.positionAta,
          tokenAAta: tokenAccountA,
          tokenBAta: tokenAccountB,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          tickArrayLower: positions[0]!.tickArrayLower,
          tickArrayUpper: positions[0]!.tickArrayUpper,
          tickArrayMap,
        }),
      ],
      [delegate]
    );
    await confirmTx(tx);

    const remainingLiquidity = liquidityAmount.sub(removeQuote.liquidityAmount);
    const poolAfter = (await fetcher.getPool(clmmpool, true)) as ClmmpoolData;
    assert.ok(poolAfter.liquidity.eq(remainingLiquidity));

    const position = await fetcher.getPosition(
      openPositionParams.position,
      true
    );
    assert.ok(position?.liquidity.eq(remainingLiquidity));
  });

  it("successfully decrease liquidity with transferred position token", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const poolBefore = (await fetcher.getPool(clmmpool, true)) as ClmmpoolData;
    const openPositionParams = positions[0]!.openPositionParams;

    const removeQuote = decreaseLiquidityQuoteByLiquidityWithParams({
      liquidity: new anchor.BN(1_000_000),
      currentSqrtPrice: poolBefore.currentSqrtPrice,
      slippageToLerance: Percentage.fromFraction(1, 100),
      currentTickIndex: poolBefore.currentTickIndex,
      tickLowerIndex,
      tickUpperIndex,
    });

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const newOwner = anchor.web3.Keypair.generate();
    const newOwnerPositionTokenAccount = await createTokenAccount(
      provider,
      openPositionParams.positionNftMint,
      newOwner.publicKey
    );
    await transfer(
      provider,
      openPositionParams.positionAta,
      newOwnerPositionTokenAccount,
      1
    );

    await setAuthority(
      provider,
      tokenAccountA,
      newOwner.publicKey,
      "AccountOwner"
    );

    await setAuthority(
      provider,
      tokenAccountB,
      newOwner.publicKey,
      "AccountOwner"
    );

    const tx = new TransactionEnvelope(
      ctx.provider,
      [
        ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
          liquidityInput,
          owner: newOwner.publicKey,
          clmmpool,
          position: openPositionParams.position,
          positionAta: newOwnerPositionTokenAccount,
          tokenAAta: tokenAccountA,
          tokenBAta: tokenAccountB,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          tickArrayLower: positions[0]!.tickArrayLower,
          tickArrayUpper: positions[0]!.tickArrayUpper,
          tickArrayMap,
        }),
      ],
      [newOwner]
    );
    await confirmTx(tx);

    const remainingLiquidity = liquidityAmount.sub(removeQuote.liquidityAmount);
    const poolAfter = (await fetcher.getPool(clmmpool, true)) as ClmmpoolData;
    assert.ok(poolAfter.liquidity.eq(remainingLiquidity));

    const position = await fetcher.getPosition(
      openPositionParams.position,
      true
    );
    assert.ok(position?.liquidity.eq(remainingLiquidity));
  });

  it("fails when liquidity amount is zero", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(0),
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    //Error Code: InvalidDeltaLiquidity. Error Number: 6025. Error Message: Invalid delta liquidity.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6025", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when position has insufficient liquidity for the withdraw amount", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(0);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1000),
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);

    // Error Code: InvalidDeltaLiquidity. Error Number: 6025. Error Message: Invalid delta liquidity.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6025", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when token min a subceeded", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(1_000_000),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000),
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);

    // Error Code: TokenAmountMinSubceeded. Error Number: 6006. Error Message: Token amount min subceeded.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6006", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when token min b subceeded", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(1_000_000),
      liquidityAmount: new anchor.BN(1_000),
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);

    // Error Code: TokenAmountMinSubceeded. Error Number: 6006. Error Message: Token amount min subceeded.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6006", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when position account does not have exactly 1 token", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const newOwner = anchor.web3.Keypair.generate();
    const newOwnerPositionTokenAccount = await createTokenAccount(
      provider,
      openPositionParams.positionNftMint,
      newOwner.publicKey
    );

    await setAuthority(
      provider,
      tokenAccountA,
      newOwner.publicKey,
      "AccountOwner"
    );

    await setAuthority(
      provider,
      tokenAccountB,
      newOwner.publicKey,
      "AccountOwner"
    );

    const tx = new TransactionEnvelope(
      ctx.provider,
      [
        ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
          liquidityInput,
          owner: newOwner.publicKey,
          clmmpool,
          position: openPositionParams.position,
          positionAta: newOwnerPositionTokenAccount,
          tokenAAta: tokenAccountA,
          tokenBAta: tokenAccountB,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          tickArrayLower: positions[0]!.tickArrayLower,
          tickArrayUpper: positions[0]!.tickArrayUpper,
          tickArrayMap,
        }),
      ],
      [newOwner]
    );

    // Error Code: PositionIllegal. Error Number: 6024. Error Message: Position is Illegal.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("6024", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when position token account mint does not match position mint", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const invalidPositionTokenAccount = await createAndMintToTokenAccount(
      provider,
      poolCreateInfo.tokenA,
      1
    );

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: invalidPositionTokenAccount,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    // Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("2006", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when position does not match clmmpool", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: createdPool0.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    // Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("2006", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when token vaults do not match clmmpool vaults", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;
    createdPool0 = openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const tx_0 = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenBVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);

    //Error Code: InvalidTokenAccount. Error Number: 6020. Error Message: Invalid token account.
    try {
      await confirmTx(tx_0);
    } catch (e) {
      assert.equal("6020", parseMessage((e as Error).message.toString()));
    }

    const tx_1 = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenAVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);

    //Error Code: InvalidTokenAccount. Error Number: 6020. Error Message: Invalid token account.
    try {
      await confirmTx(tx_1);
    } catch (e) {
      assert.equal("6020", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when owner token account mint does not match clmmpool token mint", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;
    createdPool0 = openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const tx_0 = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountB,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    //Error Code: InvalidTokenAccount. Error Number: 6020. Error Message: Invalid token account.
    try {
      await confirmTx(tx_0);
    } catch (e) {
      assert.equal("6021", parseMessage((e as Error).message.toString()));
    }

    const tx_1 = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountA,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    //Error Code: InvalidTokenAccount. Error Number: 6020. Error Message: Invalid token account.
    try {
      await confirmTx(tx_1);
    } catch (e) {
      assert.equal("6021", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when position authority is not approved delegate for position token account", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;
    createdPool0 = openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    await confirmTx(tx);
  });

  it("fails when position authority is not authorized for exactly 1 token", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;

    const delegate = anchor.web3.Keypair.generate();

    await approveToken(
      provider,
      positions[0]!.openPositionParams.positionAta,
      delegate.publicKey,
      0
    );
    await approveToken(provider, tokenAccountA, delegate.publicKey, 1_000_000);
    await approveToken(provider, tokenAccountB, delegate.publicKey, 1_000_000);

    await setAuthority(
      provider,
      tokenAccountA,
      delegate.publicKey,
      "AccountOwner"
    );

    await setAuthority(
      provider,
      tokenAccountB,
      delegate.publicKey,
      "AccountOwner"
    );

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const tx = new TransactionEnvelope(
      ctx.provider,
      [
        ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
          liquidityInput,
          owner: delegate.publicKey,
          clmmpool,
          position: openPositionParams.position,
          positionAta: openPositionParams.positionAta,
          tokenAAta: tokenAccountA,
          tokenBAta: tokenAccountB,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          tickArrayLower: positions[0]!.tickArrayLower,
          tickArrayUpper: positions[0]!.tickArrayUpper,
          tickArrayMap,
        }),
      ],
      [delegate]
    );
    // panicked at 'InvalidTokenAccountOwner
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal(
        "ProgramFailedToComplete",
        (e as Error).message.substring(
          (e as Error).message.indexOf("[0,") + 4,
          (e as Error).message.indexOf("]}})") - 1
        )
      );
    }
  });

  it("fails when position authority was not a signer", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;

    const delegate = anchor.web3.Keypair.generate();

    await approveToken(
      provider,
      positions[0]!.openPositionParams.positionAta,
      delegate.publicKey,
      1
    );
    await approveToken(provider, tokenAccountA, delegate.publicKey, 1_000_000);
    await approveToken(provider, tokenAccountB, delegate.publicKey, 1_000_000);

    await setAuthority(
      provider,
      tokenAccountA,
      delegate.publicKey,
      "AccountOwner"
    );

    await setAuthority(
      provider,
      tokenAccountB,
      delegate.publicKey,
      "AccountOwner"
    );

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: delegate.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: positions[0]!.tickArrayLower,
        tickArrayUpper: positions[0]!.tickArrayUpper,
        tickArrayMap,
      }),
    ]);
    // panicked at 'InvalidTokenAccountOwner
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal(
        "Signature verification failed",
        (e as Error).message.toString()
      );
    }
  });

  it("fails when tick arrays do not match the position", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;
    createdPool0 = openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: lowerTickArray,
        tickArrayUpper: upperTickArray,
        tickArrayMap,
      }),
    ]);
    //Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("2006", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when the tick arrays are for a different clmmpool", async () => {
    const currentTick = 0;
    const tickLowerIndex = -1280,
      tickUpperIndex = 1280;
    const liquidityAmount = new anchor.BN(1_250_000);
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount }],
      initSqrtPrice: TickMath.tickIndexToSqrtPriceX64(currentTick),
    });

    const {
      poolCreateInfo,
      tokenAccountA,
      tokenAccountB,
      positions,
      tickArrayMap,
    } = fixture.getInfos();
    const { clmmpool, tokenAVault, tokenBVault } = poolCreateInfo;
    const openPositionParams = positions[0]!.openPositionParams;
    createdPool0 = openPositionParams;

    const liquidityInput = {
      tokenMinA: new anchor.BN(0),
      tokenMinB: new anchor.BN(0),
      liquidityAmount: new anchor.BN(1_000_000),
    };

    const { params: paramsLower } = await initTickArray(ctx, pool, 0);
    const { params: paramsUpper } = await initTickArray(ctx, pool, 1280);

    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.decreaseLiquidityIx(ctx.program, {
        liquidityInput,
        owner: provider.wallet.publicKey,
        clmmpool,
        position: openPositionParams.position,
        positionAta: openPositionParams.positionAta,
        tokenAAta: tokenAccountA,
        tokenBAta: tokenAccountB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        tickArrayLower: paramsLower.tickArray,
        tickArrayUpper: paramsUpper.tickArray,
        tickArrayMap,
      }),
    ]);

    // Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.
    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("2006", parseMessage((e as Error).message.toString()));
    }
  });
});
