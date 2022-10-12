import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { Address, BN } from "@project-serum/anchor";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import { getOrCreateATA, getOrCreateATAs } from "@cremafinance/token-utils"
import type { Clmmpool } from "../clmmpool-client";
import type { ClmmpoolContext } from "../context";
import type { AccountFetcher } from "../network";
import type { ClmmpoolData, DecreaseLiquidityInput, IncreaseLiquidityInput, TokenAccountInfo } from "../types";
import { getTokenVaultAccountInfos } from "./util";
import invariant from "tiny-invariant";
import { PDAUtil } from "../utils/pda";
export const INIT_KEY = new PublicKey("11111111111111111111111111111111");
import {
  ClmmpoolIx, SwapInput
} from "../ix";
import { POSITION_NFT_UPDATE_AUTHORITY } from "../types/constants";
import { SwapQuote } from "../quotes/public/swap"
import { AddressUtil } from "../utils/address-util"
import { SwapUtils } from "../utils/swap"
import { TokenUtil } from "../utils/token-utils"
import { TickArray, TokenInfo } from '../types/client-types';
import { createTickArrayRange, TickArrayUtil, TickUtil } from "../utils/tick";
import { Decimal } from "decimal.js";
import { TickArrayIndex } from '../quotes/swap/tick-array-index';


export interface PendingOpenPosition {
  positionId: PublicKey;
  positionAccount: PublicKey;
  positionsKey: PublicKey;
  tx: TransactionEnvelope;
}


export class ClmmpoolImpl implements Clmmpool {
  private data: ClmmpoolData;
  constructor(
    readonly ctx: ClmmpoolContext,
    readonly fetcher: AccountFetcher,
    readonly address: PublicKey,
    readonly tokenAInfo: TokenInfo,
    readonly tokenBInfo: TokenInfo,
    private tokenVaultAInfo: TokenAccountInfo,
    private tokenVaultBInfo: TokenAccountInfo,
    data: ClmmpoolData
  ) {
    this.data = data;
  }

  getAddress(): PublicKey {
    return this.address;
  }

  getData(): ClmmpoolData {
    return this.data;
  }

  getTokenAInfo(): TokenInfo {
    return this.tokenAInfo;
  }

  getTokenBInfo(): TokenInfo {
    return this.tokenBInfo;
  }

  getTokenVaultAInfo(): TokenAccountInfo {
    return this.tokenVaultAInfo;
  }

  getTokenVaultBInfo(): TokenAccountInfo {
    return this.tokenVaultBInfo;
  }

  async refreshData() {
    await this.refresh();
    return this.data;
  }

  async openPosition(
    tickLower: number,
    tickUpper: number,
    liquidityInput: IncreaseLiquidityInput,
    isAFixed: boolean
  ): Promise<TransactionEnvelope> {
    await this.refresh();
    return this.getOpenPositionTx(tickLower, tickUpper, liquidityInput, isAFixed)
  }

  private async getOpenPositionTx(tickLower: number,
    tickUpper: number,
    liquidityInput: IncreaseLiquidityInput,
    isAFixed: boolean
  ): Promise<TransactionEnvelope> {
    invariant(tickLower <= tickUpper, "The tickLower must be less than tickUpper");
    invariant(TickUtil.checkTickInBounds(tickLower), "tickLower is out of bounds.");
    invariant(TickUtil.checkTickInBounds(tickUpper), "tickUpper is out of bounds.");
    const { liquidityAmount: liquidity, tokenMaxA, tokenMaxB } = liquidityInput
    invariant(liquidity.gt(new BN(0)), "liquidity must be greater than zero");

    const clmmpool = await this.fetcher.getPool(this.address, false);
    if (!clmmpool) {
      throw new Error(`clmmpool not found: ${this.address.toBase58()}`);
    }
    invariant(
      TickUtil.isTickInitializable(tickLower, clmmpool.tickSpacing),
      `lower tick ${tickLower} is not an initializable tick for tick-spacing ${clmmpool.tickSpacing}`
    );
    invariant(
      TickUtil.isTickInitializable(tickUpper, clmmpool.tickSpacing),
      `upper tick ${tickUpper} is not an initializable tick for tick-spacing ${clmmpool.tickSpacing}`
    );
    const instructions: TransactionInstruction[] = [];

    // Generate create position nft token instructions
    const positionNftMint = Keypair.generate();

    const positionPda = PDAUtil.getPositionPDA(this.ctx.program.programId, positionNftMint.publicKey);
    const metadataPda = PDAUtil.getPositionMetadataPDA(positionNftMint.publicKey);

    const positionAta = await getOrCreateATAs({
      provider: this.ctx.provider, mints: {
        positionNftMint: positionNftMint.publicKey
      }
    });

    const positionEdition = PDAUtil.getPositionEditionPDA(positionNftMint.publicKey).publicKey
    const openPositionParams = {
      tickLowerIndex: tickLower,
      tickUpperIndex: tickUpper,
      owner: this.ctx.wallet.publicKey,
      clmmpool: this.getAddress(),
      position: positionPda.publicKey,
      positionNftMint: positionNftMint.publicKey,
      positionMetadataAccount: metadataPda.publicKey,
      positionNftUpdateAuthority: POSITION_NFT_UPDATE_AUTHORITY,
      positionAta: positionAta.accounts.positionNftMint,
      positionEdition
    }

    const positionIx = ClmmpoolIx.openPositionIx(this.ctx.program, openPositionParams)
    instructions.push(positionIx)

    // add liquidity

    const accountATAs = await getOrCreateATAs({
      provider: this.ctx.provider,
      mints: {
        tokenA: clmmpool.tokenA,
        tokenB: clmmpool.tokenB
      },
      owner: this.ctx.provider.wallet.publicKey
    })
    instructions.push(...accountATAs.instructions)

    const tickArrayLower = PDAUtil.getTickArrayPDA(
      this.ctx.program.programId,
      this.address,
      TickUtil.getArrayIndex(tickLower, clmmpool.tickSpacing)
    ).publicKey;
    const tickArrayUpper = PDAUtil.getTickArrayPDA(
      this.ctx.program.programId,
      this.address,
      TickUtil.getArrayIndex(tickUpper, clmmpool.tickSpacing)
    ).publicKey;

    const tickArrayInstructions = []

    const tickArrayMap = PDAUtil.getTickArrayMapPDA(this.ctx.program.programId, this.address).publicKey
    const isTickArrayMapInit = await TickArrayUtil.isTickArrayInitialized(tickArrayMap, this.ctx.provider)
    if (!isTickArrayMapInit) {
      const initTickArrayMapIx = ClmmpoolIx.createTickArrayMapIx(this.ctx.program, {
        payer: this.ctx.wallet.publicKey,
        clmmpool: this.address,
        tickArrayMap: tickArrayMap
      })
      tickArrayInstructions.push(initTickArrayMapIx)
    }



    const isTickLowerArrayInit = await TickArrayUtil.isTickArrayInitialized(tickArrayLower, this.ctx.provider)
    if (!isTickLowerArrayInit) {
      const initTickArrayIx = await this.initTickArrayForTicks(tickLower, tickArrayLower)
      tickArrayInstructions.push(...initTickArrayIx.instructions)
    }


    if (tickArrayLower.toBase58() !== tickArrayUpper.toBase58()) {
      const isTickUpperArrayInit = await TickArrayUtil.isTickArrayInitialized(tickArrayUpper, this.ctx.provider)
      if (!isTickUpperArrayInit) {
        const initTickArrayIx = await this.initTickArrayForTicks(tickUpper, tickArrayUpper)
        tickArrayInstructions.push(...initTickArrayIx.instructions)
      }
    }
    if (tickArrayInstructions && tickArrayInstructions.length > 0) {
      instructions.push(...tickArrayInstructions)
    }

    const liquidityInputWithFixedToken = {
      tokenA: tokenMaxA,
      tokenB: tokenMaxB,
      isAFixed
    }
    const increaseLiquidityParams = {
      liquidityInputWithFixedToken,
      owner: this.ctx.wallet.publicKey,
      clmmpool: this.getAddress(),
      position: positionPda.publicKey,
      positionAta: positionAta.accounts.positionNftMint,
      tokenAAta: accountATAs.accounts.tokenA,
      tokenBAta: accountATAs.accounts.tokenB,
      tokenAVault: clmmpool.tokenAVault,
      tokenBVault: clmmpool.tokenBVault,
      tickArrayLower,
      tickArrayUpper,
      tickArrayMap: tickArrayMap
    }
    const liquidityIx = ClmmpoolIx.increaseLiquidityWithFixedTokenIx(this.ctx.program, increaseLiquidityParams);
    instructions.push(liquidityIx)

    if (
      clmmpool.tokenA.equals(NATIVE_MINT) &&
      tokenMaxA.gt(new BN(0))
    ) {
      const wrapSOLInstructions = await TokenUtil.wrapSOL(this.ctx.provider, new Decimal(tokenMaxA.toString()));
      instructions.unshift(...wrapSOLInstructions.instructions);
      const unwrapSOLInstructions = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenA);
      instructions.push(...unwrapSOLInstructions.instructions);
    }
    if (
      clmmpool.tokenB.equals(NATIVE_MINT) &&
      tokenMaxB.gt(new BN(0))
    ) {
      const wrapSOLInstructions = await TokenUtil.wrapSOL(this.ctx.provider, new Decimal(tokenMaxB.toString()));
      instructions.unshift(...wrapSOLInstructions.instructions);
      const unwrapSOLInstructions = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenB);
      instructions.push(...unwrapSOLInstructions.instructions);
    }

    return new TransactionEnvelope(this.ctx.provider, instructions, [positionNftMint])

  }


  async closePosition(liquidityInput: DecreaseLiquidityInput, positionId: PublicKey, positionNftMint: PublicKey, swapKey: PublicKey) {
    await this.refresh()
    return this.getClosePositionIx(liquidityInput, positionId, positionNftMint, swapKey)
  }


  private async getClosePositionIx(liquidityInput: DecreaseLiquidityInput, positionId: PublicKey, positionNftMint: PublicKey, swapKey: PublicKey) {
    const position = await this.fetcher.getPosition(positionId)
    if (!position) {
      throw new Error(`Position not found: ${positionId.toBase58()}`);
    }

    const clmmpool = await this.fetcher.getPool(swapKey, true);
    if (!clmmpool) {
      throw new Error("Unable to fetch clmmpool for this position.");
    }

    const wallet = this.ctx.provider.wallet.publicKey
    const positionAta = await getOrCreateATAs({ provider: this.ctx.provider, mints: { positionAddress: positionNftMint }, owner: wallet });
    const accountATAs = await getOrCreateATAs({
      provider: this.ctx.provider,
      mints: {
        tokenA: clmmpool.tokenA,
        tokenB: clmmpool.tokenB
      },
      owner: wallet
    })
    const decreaseLiquidityIx = new TransactionEnvelope(this.ctx.provider, [ClmmpoolIx.decreaseLiquidityIx(this.ctx.program, {
      liquidityInput,
      owner: wallet,
      clmmpool: swapKey,
      position: positionId,
      positionAta: positionAta.accounts.positionAddress,
      tokenAAta: accountATAs.accounts.tokenA,
      tokenBAta: accountATAs.accounts.tokenB,
      tokenAVault: clmmpool.tokenAVault,
      tokenBVault: clmmpool.tokenBVault,
      tickArrayLower: PDAUtil.getTickArrayPDA(
        this.ctx.program.programId,
        swapKey,
        TickUtil.getArrayIndex(position.tickLowerIndex, clmmpool.tickSpacing)
      ).publicKey,
      tickArrayUpper: PDAUtil.getTickArrayPDA(
        this.ctx.program.programId,
        swapKey,
        TickUtil.getArrayIndex(position.tickUpperIndex, clmmpool.tickSpacing)
      ).publicKey,
      tickArrayMap: PDAUtil.getTickArrayMapPDA(
        this.ctx.program.programId,
        swapKey,
      ).publicKey
    })])

    const tickUpper = position.tickUpperIndex 
    const tickLower = position.tickLowerIndex
    console.log(tickLower, 'tickLower##')
    const tickArrayLower = PDAUtil.getTickArrayPDA(
      this.ctx.program.programId,
      swapKey,
      TickUtil.getArrayIndex(tickLower, clmmpool.tickSpacing)
    ).publicKey;
    const tickArrayUpper = PDAUtil.getTickArrayPDA(
      this.ctx.program.programId,
      swapKey,
      TickUtil.getArrayIndex(tickUpper, clmmpool.tickSpacing)
    ).publicKey;

    const metadataPda = PDAUtil.getPositionMetadataPDA(positionNftMint);

    const cliamIx = new TransactionEnvelope(this.ctx.provider, [
      ClmmpoolIx.collectFeeIx(this.ctx.program, {
        owner: wallet,
        clmmpool: swapKey,
        position: positionId,
        positionAta: positionAta.accounts.positionAddress,
        tokenAAta: accountATAs.accounts.tokenA,
        tokenBAta: accountATAs.accounts.tokenB,
        tokenAVault: clmmpool.tokenAVault,
        tokenBVault: clmmpool.tokenBVault,
        tickArrayLower,
        tickArrayUpper
      })]
    )

    // const  collectRewarderIx = new TransactionEnvelope(this.ctx.provider,[
    //   ClmmpoolIx.collectRewarderIx(this.ctx.program,{
    //     owner: wallet,
    //     clmmpool: swapKey,
    //     position: positionId,
    //     positionAta: positionAta.accounts.positionAddress,
    //     rewarderAta:'',
    //     mintWrapper:clmmpool.rewarderInfos[i].mintWrapper ,
    //     minter:'',
    //     rewardsTokenMint:'',
    //     tickArrayLower,
    //     tickArrayUpper
    //   })
    // ]) 

    const collectRewarderIxResult = [];
    const collectRewarderArr:string[] = []

    for (let i = 0; i < 3; i++) {
      // @ts-ignore
      const rewarderAta = await getOrCreateATAs({ provider: this.ctx.provider, mints:{ address:clmmpool.rewarderInfos[i].mint}, owner: wallet });
      // @ts-ignore
      if(!PublicKey.default.equals(clmmpool.rewarderInfos[i].mint)){

        if (rewarderAta && rewarderAta.instructions&&!collectRewarderArr.includes(rewarderAta.accounts.address.toBase58())) {
          collectRewarderArr.push(rewarderAta.accounts.address.toBase58())
          collectRewarderIxResult.push(...rewarderAta.instructions)
        }
        const collectRewarderIx =
          ClmmpoolIx.collectRewarderIx(this.ctx.program, {
            owner: wallet,
            clmmpool: swapKey,
            position: positionId,
            positionAta: positionAta.accounts.positionAddress,
            rewarderAta: rewarderAta.accounts.address,
            // @ts-ignore
            mintWrapper: clmmpool.rewarderInfos[i].mintWrapper,
            // @ts-ignore
            minter: clmmpool.rewarderInfos[i].minter,
            // @ts-ignore
            rewardsTokenMint: clmmpool.rewarderInfos[i].mint,
            tickArrayLower,
            tickArrayUpper,
            rewarderIndex:i
          }
          )
          collectRewarderIxResult.push(collectRewarderIx)
      }
    }


    const positionEdition = PDAUtil.getPositionEditionPDA(positionNftMint).publicKey

    const closePositionIx = new TransactionEnvelope(this.ctx.provider, [
      ...decreaseLiquidityIx.instructions,
      ...collectRewarderIxResult,
      ...cliamIx.instructions,
      
      ClmmpoolIx.removePositionIx(this.ctx.program, {
        owner: wallet,
        position: positionId,
        positionNftMint: positionNftMint,
        positionAta: positionAta.accounts.positionAddress,
        positionMetadataAccount: metadataPda.publicKey,
        positionEdition
      })
    ])
    return closePositionIx
  }

  async initTickArrayForTicks(arrayIndex: number, tickArrayPda: PublicKey) {
    await this.refresh();
    return this.getInitTickArrayForTicks(arrayIndex, tickArrayPda)
  }
  private async getInitTickArrayForTicks(arrayIndex: number, tickArrayPda: PublicKey) {
    const createTickArrayIx = new TransactionEnvelope(this.ctx.provider, [ClmmpoolIx.createTickArrayIx(this.ctx.program, {
      arrayIndex: TickUtil.getArrayIndex(arrayIndex, this.data.tickSpacing),
      payer: this.ctx.provider.wallet.publicKey,
      clmmpool: this.address,
      tickArray: tickArrayPda
    })])
    return createTickArrayIx
  }

  async swap(quote: SwapQuote, sourceWallet?: Address): Promise<TransactionEnvelope> {
    const sourceWalletKey = sourceWallet
      ? AddressUtil.toPubKey(sourceWallet)
      : this.ctx.wallet.publicKey;
    return this.getSwapTx(quote, sourceWalletKey);
  }

  private async getSwapTx(input: SwapInput, wallet: PublicKey): Promise<TransactionEnvelope> {
    const clmmpool = this.data;

    const accountATAs = await getOrCreateATAs({
      provider: this.ctx.provider,
      mints: {
        tokenA: clmmpool.tokenA,
        tokenB: clmmpool.tokenB
      },
      owner: wallet
    })

    const tickArrayMap = PDAUtil.getTickArrayMapPDA(this.ctx.program.programId, this.address)

    const sqrtPriceLimit = SwapUtils.getDefaultSqrtPriceLimit(input.aToB)
    const tickArrayIndex = TickUtil.getArrayIndex(this.data.currentTickIndex, this.data.tickSpacing)
    const remainAccount = await createTickArrayRange(this.ctx, this.ctx.program.programId ,this.address, tickArrayIndex, 0, input.aToB)
    // const tickArrays = [];
    // for (const r of remainAccount) {
    //   const tickArrayData = await this.ctx.fetcher.getTickArray(r);
    //   const tickArray: TickArray = {
    //     address: r,
    //     data: tickArrayData,
    //   };
    //   tickArrays.push(tickArray);
    // }
    const tx = new TransactionEnvelope(this.ctx.provider, [...accountATAs.instructions, ClmmpoolIx.swapIx(this.ctx.program, {
      aToB: input.aToB,
      byAmountIn: input.byAmountIn,
      amount: new BN(input.amount.toString()),
      amountLimit: new BN(input.amountLimit.toString()),
      sqrtPriceLimit,
      clmmpool: this.address,
      tokenA: clmmpool.tokenA,
      tokenB: clmmpool.tokenB,
      accountA: accountATAs.accounts.tokenA,
      accountB: accountATAs.accounts.tokenB,
      tokenAVault: clmmpool.tokenAVault,
      tokenBVault: clmmpool.tokenBVault,
      tickArrayMap: tickArrayMap.publicKey,
      owner: wallet,
      tickArrays: remainAccount,
      clmmConfig: PDAUtil.getClmmConfigPDA(this.ctx.program.programId).publicKey
    })])
    const amount = new Decimal(input.amount.toString())
    const amountLimit = new Decimal(input.amountLimit.toString())

    if (clmmpool.tokenA.equals(NATIVE_MINT)) {
      if (input.aToB) {
        const wrapSOLTx = await TokenUtil.wrapSOL(this.ctx.provider, input.byAmountIn ? amount : amountLimit);
        tx.instructions.unshift(...wrapSOLTx.instructions);
        const unwrapSOLTx = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenA)
        tx.instructions.push(...unwrapSOLTx.instructions);
      } else {
        const unwrapSOLTx = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenB);
        tx.instructions.push(...unwrapSOLTx.instructions);
      }
    }

    if (clmmpool.tokenB.equals(NATIVE_MINT)) {
      if (input.aToB) {
        const unwrapSOLTx = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenB);
        tx.instructions.push(...unwrapSOLTx.instructions);
      } else {
        const wrapSOLTx = await TokenUtil.wrapSOL(this.ctx.provider, input.byAmountIn ? amount : amountLimit);
        tx.instructions.unshift(...wrapSOLTx.instructions);
        const unwrapSOLTx = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenA);
        tx.instructions.push(...unwrapSOLTx.instructions);
      }
    }

    return tx
  }

  private async refresh() {
    const account = await this.fetcher.getPool(this.address, true);
    if (account) {
      // const rewardInfos = await getRewardInfos(this.fetcher, account, true);
      const [tokenVaultAInfo, tokenVaultBInfo] =
        await getTokenVaultAccountInfos(this.fetcher, account, true);
      this.data = account;
      if (tokenVaultAInfo) {
        this.tokenVaultAInfo = tokenVaultAInfo;
      }

      if (tokenVaultBInfo) {
        this.tokenVaultBInfo = tokenVaultBInfo;
      }

      // this.rewardInfos = rewardInfos;
    }
  }

}
