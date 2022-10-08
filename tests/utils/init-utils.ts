import type { BN } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import type { TransactionReceipt } from "@saberhq/solana-contrib";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import type { Keypair, PublicKey } from "@solana/web3.js";

import { TickSpacing } from ".";
import { ClmmpoolContext, ClmmpoolIx, ClmmPoolUtil, CreateClmmpoolParams, CreateTickArrayParams, createTickArrayRange, IncreaseLiquidityInputWithFixedToken, InitClmmConfigParams, OpenPositionParams, PDAUtil, TickMath, TickUtil } from "../../src";
import { MathUtil } from "../../src/math/utils";
import {
  generateDefaultConfigParams,
  generateDefaultCreatePoolParams,
  generateDefaultInitFeeTierParams,
  generateDefaultInitTickArrayMapParams,
  generateDefaultInitTickArrayParams,
  generateDefaultOpenPositionParams,
} from "./test-builders";
import { ZERO_BN } from "./test-consts";
import { createAndMintToAssociatedTokenAccount } from "./token";
import { confirmTx } from "./utils";

const defaultInitSqrtPrice = MathUtil.toX64_BN(new anchor.BN(5));

/**
 * Initialize a brand new WhirlpoolsConfig account and construct a set of InitPoolParams
 * that can be used to initialize a pool with.
 * @param client - an instance of whirlpool client containing the program & provider
 * @param initSqrtPrice - the initial sqrt-price for this newly generated pool
 * @returns An object containing the params used to init the config account & the param that can be used to init the pool account.
 */
export async function buildTestPoolParams(
  ctx: ClmmpoolContext,
  tickSpacing: number,
  feeRate = 2500,
  initSqrtPrice = defaultInitSqrtPrice,
  payer?: PublicKey
) {
  const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);

  const { params: feeTierParams } = await createFeeTier(
    ctx,
    configInitInfo,
    configKeypairs.protocolAuthorityKeypair,
    tickSpacing,
    feeRate
  );

  const { poolCreateInfo } = await generateDefaultCreatePoolParams(
    ctx,
    configInitInfo.clmmConfig,
    feeTierParams.feeTierPDA.publicKey,
    tickSpacing,
    initSqrtPrice,
    payer
  );

  return {
    configCreateInfo: configInitInfo,
    configKeypairs,
    poolCreateInfo,
    feeTierParams,
  };
}

/**
 * Initialize a brand new set of WhirlpoolsConfig & Whirlpool account
 * @param client - an instance of whirlpool client containing the program & provider
 * @param initSqrtPrice - the initial sqrt-price for this newly generated pool
 * @returns An object containing the params used to initialize both accounts.
 */
export async function createTestPool(
  ctx: ClmmpoolContext,
  tickSpacing: number,
  initSqrtPrice: BN,
  payer?: Keypair
) {
  const { configCreateInfo, configKeypairs, poolCreateInfo, feeTierParams } =
    await buildTestPoolParams(
      ctx,
      tickSpacing,
      2500,
      initSqrtPrice,
      payer?.publicKey
    );

  const tx = new TransactionEnvelope(ctx.provider, [
    ClmmpoolIx.createClmmpoolIx(ctx.program, {
      initSqrtPrice: poolCreateInfo.initSqrtPrice,
      tickSpacing: poolCreateInfo.tickSpacing,
      payer: poolCreateInfo.payer,
      clmmConfig: poolCreateInfo.clmmConfig,
      feeTier: poolCreateInfo.feeTier,
      clmmpool: poolCreateInfo.clmmpool,
      tokenA: poolCreateInfo.tokenA,
      tokenB: poolCreateInfo.tokenB,
      tokenAVault: poolCreateInfo.tokenAVault,
      tokenBVault: poolCreateInfo.tokenBVault,
    }),
  ]);

  if (payer) {
    tx.addSigners(payer);
  }

  const receipt = await confirmTx(tx);

  return {
    txId: receipt.signature,
    configCreateInfo,
    configKeypairs,
    poolCreateInfo,
    feeTierParams,
  };
}

export async function createFeeTier(
  ctx: ClmmpoolContext,
  configCreateInfo: InitClmmConfigParams,
  feeAuthorityKeypair: Keypair,
  tickSpacing: number,
  feeRate: number,
  payer?: Keypair
) {
  const feeTierPDA = PDAUtil.getFeeTierPDA(
    ctx.program.programId,
    configCreateInfo.clmmConfig,
    tickSpacing
  );

  const params = generateDefaultInitFeeTierParams(
    ctx,
    configCreateInfo.clmmConfig,
    configCreateInfo.protocolAuthority,
    tickSpacing,
    feeRate,
    feeTierPDA.publicKey,
    payer?.publicKey
  );

  const tx = new TransactionEnvelope(
    ctx.provider,
    [
      ClmmpoolIx.createFeeTierIx(ctx.program, {
        tickSpacing: params.tickSpacing,
        feeRate: params.feeRate,
        payer: params.payer,
        clmmConfig: params.clmmConfig,
        feeTier: params.feeTier,
        protocolAuthority: params.feeAuthority,
      }),
    ],
    [feeAuthorityKeypair]
  );
  if (payer) {
    tx.addSigners(payer);
  }

  const receipt = await confirmTx(tx);
  return {
    txId: receipt.signature,
    params,
  };
}

export async function createFeeTierWithoutSign(
  ctx: ClmmpoolContext,
  configCreateInfo: InitClmmConfigParams,
  tickSpacing: number,
  feeRate: number,
  payer?: Keypair
) {
  const feeTierPDA = PDAUtil.getFeeTierPDA(
    ctx.program.programId,
    configCreateInfo.clmmConfig,
    tickSpacing
  );

  const params = generateDefaultInitFeeTierParams(
    ctx,
    configCreateInfo.clmmConfig,
    configCreateInfo.protocolAuthority,
    tickSpacing,
    feeRate,
    feeTierPDA.publicKey,
    payer?.publicKey
  );

  const tx = new TransactionEnvelope(ctx.provider, [
    ClmmpoolIx.createFeeTierIx(ctx.program, {
      tickSpacing: params.tickSpacing,
      feeRate: params.feeRate,
      payer: params.payer,
      clmmConfig: params.clmmConfig,
      feeTier: params.feeTier,
      protocolAuthority: params.feeAuthority,
    }),
  ]);
  if (payer) {
    tx.addSigners(payer);
  }

  const receipt = await confirmTx(tx);
  return {
    txId: receipt.signature,
    params,
  };
}

export async function openTestPosition(
  ctx: ClmmpoolContext,
  clmmpool: PublicKey,
  tickLowerIndex: number,
  tickUpperIndex: number,
  owner?: Keypair
) {
  const { params, nftMint } = await generateDefaultOpenPositionParams(
    ctx,
    clmmpool,
    tickLowerIndex,
    tickUpperIndex,
    owner?.publicKey
  );

  const openPositionTx = new TransactionEnvelope(
    ctx.provider,
    [
      ClmmpoolIx.openPositionIx(ctx.program, {
        ...params,
      }),
    ],
    [nftMint]
  );
  if (owner) {
    openPositionTx.addSigners(owner);
  }

  const receipt = await confirmTx(openPositionTx);

  return {
    txId: receipt.signature,
    params,
    nftMint,
  };
}

export async function initTickArray(
  ctx: ClmmpoolContext,
  clmmpool: PublicKey,
  arrayIndex: number,
  payer?: Keypair
): Promise<{ receipt: TransactionReceipt; params: CreateTickArrayParams }> {
  const params = generateDefaultInitTickArrayParams(
    ctx,
    clmmpool,
    arrayIndex,
    payer?.publicKey
  );

  const tx = new TransactionEnvelope(ctx.provider, [
    ClmmpoolIx.createTickArrayIx(ctx.program, params),
  ]);
  if (payer) {
    tx.addSigners(payer);
  }

  const receipt = await confirmTx(tx);
  return {
    receipt,
    params,
  };
}

export async function createTestPoolWithTokens(
  ctx: ClmmpoolContext,
  tickSpacing: number,
  initSqrtPrice = defaultInitSqrtPrice,
  mintAmount = new anchor.BN("15000000000")
) {
  const provider = ctx.provider;

  console.log(122);
  const { poolCreateInfo, configCreateInfo, configKeypairs } =
    await createTestPool(ctx, tickSpacing, initSqrtPrice);

  console.log(123);
  const { tokenA, tokenB, clmmpool } = poolCreateInfo;
  const tokenAccountA = await createAndMintToAssociatedTokenAccount(
    provider,
    tokenA,
    mintAmount
  );
  console.log(124);
  const tokenAccountB = await createAndMintToAssociatedTokenAccount(
    provider,
    tokenB,
    mintAmount
  );
  return {
    poolCreateInfo,
    configCreateInfo,
    configKeypairs,
    clmmpool,
    tokenAccountA,
    tokenAccountB,
  };
}

export type FundedPositionParams = {
  tickLowerIndex: number;
  tickUpperIndex: number;
  liquidityAmount: BN;
};

export interface FundedPositionInfo {
  openPositionParams: OpenPositionParams;
  nftMintKeypair: Keypair;
  tickArrayLower: PublicKey;
  tickArrayUpper: PublicKey;
}

export async function fundPositions(
  ctx: ClmmpoolContext,
  poolCreateInfo: CreateClmmpoolParams,
  tokenAAccount: PublicKey,
  tokenBAccount: PublicKey,
  fundParams: FundedPositionParams[]
): Promise<FundedPositionInfo[]> {
  const { clmmpool, tokenAVault, tokenBVault, initSqrtPrice, tickSpacing } =
    poolCreateInfo;

  return await Promise.all(
    fundParams.map(async (param): Promise<FundedPositionInfo> => {
      const { params: positionInfo, nftMint } = await openTestPosition(
        ctx,
        clmmpool,
        param.tickLowerIndex,
        param.tickUpperIndex
      );

      // fet clmm pool then get tick spacing

      const tickArrayLower = PDAUtil.getTickArrayPDA(
        ctx.program.programId,
        clmmpool,
        TickUtil.getArrayIndex(param.tickLowerIndex, tickSpacing)
      ).publicKey;

      const tickArrayUpper = PDAUtil.getTickArrayPDA(
        ctx.program.programId,
        clmmpool,
        TickUtil.getArrayIndex(param.tickUpperIndex, tickSpacing)
      ).publicKey;

      const tickArrayMap = PDAUtil.getTickArrayMapPDA(
        ctx.program.programId,
        clmmpool
      ).publicKey;

      if (param.liquidityAmount.gt(ZERO_BN)) {
        const { tokenA, tokenB } = ClmmPoolUtil.getTokenAmountFromLiquidity(
          param.liquidityAmount,
          initSqrtPrice,
          TickMath.tickIndexToSqrtPriceX64(param.tickLowerIndex),
          TickMath.tickIndexToSqrtPriceX64(param.tickUpperIndex),
          true
        );

        const liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken =
          {
            tokenA,
            tokenB,
            isAFixed: true,
          };

        const increateLiquidityTx = new TransactionEnvelope(ctx.provider, [
          ClmmpoolIx.increaseLiquidityWithFixedTokenIx(ctx.program, {
            liquidityInputWithFixedToken,
            owner: ctx.provider.wallet.publicKey,
            clmmpool,
            position: positionInfo.position,
            positionAta: positionInfo.positionAta,
            tokenAAta: tokenAAccount,
            tokenBAta: tokenBAccount,
            tokenAVault,
            tokenBVault,
            tickArrayLower,
            tickArrayUpper,
            tickArrayMap,
          }),
        ]);

        await confirmTx(increateLiquidityTx);
      }
      return {
        openPositionParams: positionInfo,
        nftMintKeypair: nftMint,
        tickArrayLower,
        tickArrayUpper,
      };
    })
  );
}

export async function createTestPoolWithLiquidity(ctx: ClmmpoolContext) {
  const {
    poolCreateInfo,
    configCreateInfo,
    configKeypairs,
    clmmpool,
    tokenAccountA,
    tokenAccountB,
  } = await createTestPoolWithTokens(
    ctx,
    TickSpacing.Standard,
    defaultInitSqrtPrice
  );

  const tickArrays = await createTickArrayRange(
    ctx,
    ctx.program.programId,
    clmmpool,
    117, // to 119
    3,
    false
  );

  const fundParams: FundedPositionParams[] = [
    {
      liquidityAmount: new anchor.BN(100_000),
      tickLowerIndex: 1280, // 116 * 64
      tickUpperIndex: 108, // 119 * 64
    },
  ];

  const positionInfos = await fundPositions(
    ctx,
    poolCreateInfo,
    tokenAccountA,
    tokenAccountB,
    fundParams
  );

  return {
    poolCreateInfo,
    configInitInfo: configCreateInfo,
    configKeypairs,
    positionOpenInfo: positionInfos[0]!.openPositionParams,
    tokenAccountA,
    tokenAccountB,
    tickArrays,
  };
}

export async function createTestTickArrayMap(
  ctx: ClmmpoolContext,
  clmmpool: PublicKey,
  payerKeypair?: Keypair
) {
  const tickArrayMapInitInfo = generateDefaultInitTickArrayMapParams(
    ctx,
    clmmpool,
    payerKeypair ? payerKeypair.publicKey : ctx.provider.wallet.publicKey
  );

  const tx = new TransactionEnvelope(ctx.provider, [
    ClmmpoolIx.createTickArrayMapIx(ctx.program, {
      ...tickArrayMapInitInfo,
    }),
  ]);
  if (payerKeypair) {
    tx.addSigners(payerKeypair);
  }

  await confirmTx(tx);
  return tickArrayMapInitInfo;
}
