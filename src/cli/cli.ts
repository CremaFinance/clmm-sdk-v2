// import { PublicKey } from "@solana/web3.js";
// import { PublicKey } from "@solana/web3.js";
import { Command } from "commander";
// import Decimal from "decimal.js";
// import { IncreaseLiquidityInput } from "../types";
import { catchFinallyExit, makeSDK } from "./utils";
import { ClmmPoolUtil, getAllClmmpools, IncreaseLiquidityInput } from "..";
import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
// import { confirmTx } from "../../tests/utils";
import { PublicKey } from '@solana/web3.js';
import { TickMath } from '../math/tick';



const program = new Command().name('pools')
program.version('1.0.0');

program
  .command("open-position")
  .description("open-position")
  .requiredOption("-l, --tickLower <tickLower>", "tickLower info")
  .requiredOption("-u, --tickUpper <tickUpper>", "tickUpper info")
  .requiredOption("-a, --tokenMaxA <tokenMaxA>", "tokenMaxA info")
  .requiredOption("-b, --tokenMaxB <tokenMaxB>", "tokenMaxB info")
  .requiredOption("-i, --isAFixed <isAFixed>", "isAFixed info")
  // .requiredOption("-m, --liquidityAmount <liquidityAmount>", "liquidityAmount info")
  .action((arg: any) => {
    const tickLower = arg.tickLower;
    const tickUpper = arg.tickUpper;
    const tokenMaxA = new anchor.BN(arg.tokenMaxA * Math.pow(10, 9));
    const tokenMaxB = new anchor.BN(arg.tokenMaxA * Math.pow(10, 9));
    // const amountA = new Decimal(arg.tokenMaxA)
    // const amountB = new Decimal(arg.tokenMaxB)
    const isAFixed = arg.isAFixed
    const tokenAmount = isAFixed ? tokenMaxA : tokenMaxB
    const liquidityInput = ClmmPoolUtil.estLiquidityAndTokenAmountFromOneAmounts(
      0,
      tickLower,
      tickUpper,
      tokenAmount,
      isAFixed,
      true,
      true,
      0
    )
    catchFinallyExit(openPosition(tickLower, tickUpper, liquidityInput, isAFixed));
  });

program.command("increase-liquidity")
  .description("increase-liquidity")
  .requiredOption("-a, --tokenMaxA <tokenMaxA>", "tokenMaxA info")
  .requiredOption("-b, --tokenMaxB <tokenMaxB>", "tokenMaxB info")
  .requiredOption("-p --positionId <positionId>", "positionId address")
  .requiredOption("-n --positionNftMint <positionNftMint>", "positionNftMint address")
  .requiredOption("-k --swapKey <swapKey>", "swapKey address")
  .requiredOption("-i --isAFixed <isAFixed>", "isAFixed Info")
  .action((arg: any) => {
    const tokenMaxA = new anchor.BN(arg.tokenMaxA * Math.pow(10, 9));
    const tokenMaxB = new anchor.BN(arg.tokenMaxA * Math.pow(10, 9));
    const positionId = new PublicKey(arg.positionId);
    const positionNftMint = new PublicKey(arg.positionNftMint);
    const swapKey = new PublicKey(arg.swapKey)
    const isAFixed = arg.isAFixed
    catchFinallyExit(increaseLiquidity(tokenMaxA, tokenMaxB, positionId, positionNftMint, swapKey, isAFixed))
  })

program.command("decrease-liquidity")
  .description('decrease-liquidity')
  .requiredOption("-a, --tokenMaxA <tokenMaxA>", "tokenMaxA info")
  .requiredOption("-b, --tokenMaxB <tokenMaxB>", "tokenMaxB info")
  .requiredOption("-p --positionId <positionId>", "positionId address")
  .requiredOption("-n --positionNftMint <positionNftMint>", "positionNftMint address")
  .requiredOption("-k --swapKey <swapKey>", "swapKey address")
  .requiredOption("-i --isAFixed <isAFixed>", "isAFixed Info")
  .action((arg: any) => {
    const tokenMinA = new anchor.BN(arg.tokenMaxA * Math.pow(10, 9));
    const tokenMinB = new anchor.BN(arg.tokenMaxA * Math.pow(10, 9));
    const positionId = new PublicKey(arg.positionId);
    const positionNftMint = new PublicKey(arg.positionNftMint);
    const swapKey = new PublicKey(arg.swapKey)
    const isAFixed = arg.isAFixed
    catchFinallyExit(decreaseLiquidity(tokenMinA, tokenMinB, positionId, positionNftMint, swapKey, isAFixed));
  })
program.command("claim")
  .description("claim")
  .requiredOption("-p --positionId <positionId>", "positionId address")
  .requiredOption("-n --positionNftMint <positionNftMint>", "positionNftMint address")
  .requiredOption("-k --swapKey <swapKey>", "swapKey address")
  .action((arg: any) => {
    const positionId = new PublicKey(arg.positionId);
    const positionNftMint = new PublicKey(arg.positionNftMint);
    const swapKey = new PublicKey(arg.swapKey)
    catchFinallyExit(claim(positionId, positionNftMint, swapKey));
  })

program.command("close-position")
  .description("close-position")
  .requiredOption("-p --positionId <positionId>", "positionId address")
  .requiredOption("-n --positionNftMint <positionNftMint>", "positionNftMint address")
  .requiredOption("-k --swapKey <swapKey>", "swapKey address")
  // .requiredOption("-a, --tokenMaxA <tokenMaxA>", "tokenMaxA info")
  // .requiredOption("-b, --tokenMaxB <tokenMaxB>", "tokenMaxB info")
  // .requiredOption("-i --isAFixed <isAFixed>", "isAFixed Info")
  .action((arg: any) => {
    const positionId = new PublicKey(arg.positionId);
    const positionNftMint = new PublicKey(arg.positionNftMint);
    const swapKey = new PublicKey(arg.swapKey)
    // const tokenMinA = new anchor.BN(arg.tokenMaxA * Math.pow(10, 9));
    // const tokenMinB = new anchor.BN(arg.tokenMaxA * Math.pow(10, 9));
    catchFinallyExit(closePosition(positionId, positionNftMint, swapKey))
  })
program.parse(process.argv);

async function openPosition(
  tickLower: number,
  tickUpper: number,
  liquidityInput: IncreaseLiquidityInput,
  isAFixed: boolean
  // amountA: Decimal,
  // amountB: Decimal
) {
  const sdk = await makeSDK()
  const poolList = await getAllClmmpools(sdk.ctx.provider.connection)
  const swapSdk = await sdk.getPool(new PublicKey('2zr9FAV9MeATbRzow9MCsYip3EZgE6nXtr1puYbJNSh3'))
  const tx = await swapSdk.openPosition(tickLower, tickUpper, liquidityInput, isAFixed)
  await tx.confirm()
}

async function increaseLiquidity(
  tokenMaxA: BN,
  tokenMaxB: BN,
  positionId: PublicKey,
  positionNftMint: PublicKey,
  swapKey: PublicKey,
  isAFixed: boolean
) {
  const sdk = await makeSDK()
  const positionSdk = await sdk.getPosition(new PublicKey(positionId))
  const positionInfo = await positionSdk.getData()
  const tickLower = positionInfo.tickLowerIndex
  const tickUpper = positionInfo.tickUpperIndex
  const tokenAmount = isAFixed ? tokenMaxA : tokenMaxB
  const liquidityInput = ClmmPoolUtil.estLiquidityAndTokenAmountFromOneAmounts(
    0,
    tickLower,
    tickUpper,
    tokenAmount,
    isAFixed,
    true,
    true,
    0
  )

  const tx = await positionSdk.increaseLiquidity(liquidityInput, positionId, positionNftMint, swapKey, isAFixed)
  await tx.confirm()
}

async function decreaseLiquidity(
  tokenMinA: BN,
  tokenMinB: BN,
  positionId: PublicKey,
  positionNftMint: PublicKey,
  swapKey: PublicKey,
  isAFixed: boolean
) {
  const sdk = await makeSDK()
  const positionSdk = await sdk.getPosition(positionId)
  const positionInfo = await positionSdk.getData()
  const tickLower = positionInfo.tickLowerIndex
  const tickUpper = positionInfo.tickUpperIndex
  const tokenAmount = isAFixed ? tokenMinA : tokenMinB
  const { tokenMaxA, tokenMaxB, liquidityAmount } = ClmmPoolUtil.estLiquidityAndTokenAmountFromOneAmounts(
    0,
    tickLower,
    tickUpper,
    tokenAmount,
    isAFixed,
    false,
    false,
    0
  )
  const liquidityInput = {
    tokenMinA: tokenMaxA,
    tokenMinB: tokenMaxB,
    liquidityAmount
  }

  const tx = await positionSdk.decreaseLiquidity(liquidityInput, positionId, positionNftMint, swapKey)
  await tx.confirm()
}

async function claim(positionId: PublicKey, positionNftMint: PublicKey, swapKey: PublicKey) {
  const sdk = await makeSDK()
  const positionSdk = await sdk.getPosition(positionId)
  const tx = await positionSdk.claim(positionId, positionNftMint, swapKey)
  await tx.confirm()
}

async function closePosition(positionId: PublicKey, positionNftMint: PublicKey, swapKey: PublicKey) {
  const sdk = await makeSDK()
  const swapSdk = await sdk.getPool(new PublicKey('2zr9FAV9MeATbRzow9MCsYip3EZgE6nXtr1puYbJNSh3'))
  const positionSdk = await sdk.getPosition(positionId)
  const positionInfo = await positionSdk.getData()
  const tickLower = new anchor.BN(positionInfo.tickLowerIndex)
  const tickUpper = new anchor.BN(positionInfo.tickUpperIndex)
  // const tokenAmount = false ? tokenMinA : tokenMinB
  const curSqrtPrice = TickMath.tickIndexToSqrtPriceX64(0)
  const { tokenA, tokenB } = ClmmPoolUtil.getTokenAmountFromLiquidity(
    positionInfo.liquidity,
    curSqrtPrice,
    tickLower,
    tickUpper,
    false
  )
  const liquidityInput = {
    tokenMinA: tokenA,
    tokenMinB: tokenB,
    liquidityAmount:positionInfo.liquidity
  }
  const tx = await swapSdk.closePosition(liquidityInput, positionId, positionNftMint, swapKey)
  await tx.confirm()
}
