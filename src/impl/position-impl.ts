import { getOrCreateATAs, NATIVE_MINT } from "@cremafinance/token-utils";
import type { PublicKey } from "@solana/web3.js";
import type { Position } from "../clmmpool-client";
import type { ClmmpoolContext } from "../context";
import { ClmmpoolIx } from "../ix";
import type { AccountFetcher } from "../network";
import type { DecreaseLiquidityInput, IncreaseLiquidityInput, PositionData } from "../types";
import { PDAUtil } from "../utils/pda";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import { TickArrayUtil, TickUtil } from "../utils/tick";
import { TokenUtil } from "../utils/token-utils";
import { Decimal } from 'decimal.js';
import BN from "bn.js";

export class PositionImpl implements Position {
  private data: PositionData;
  constructor(
    readonly ctx: ClmmpoolContext,
    readonly fetcher: AccountFetcher,
    readonly address: PublicKey,
    data: PositionData
  ) {
    this.data = data;
  }

  getAddress(): PublicKey {
    return this.address;
  }

  getData(): PositionData {
    return this.data;
  }

  async refreshData() {
    await this.refresh();
    return this.data;
  }

  async increaseLiquidity(liquidityInput: IncreaseLiquidityInput, positionId: PublicKey, positionNftMint: PublicKey, swapKey: PublicKey, isAFixed: boolean) {
    await this.refreshData()
    return this.getIncreaseLiquidityTx(liquidityInput, positionId, positionNftMint, swapKey, isAFixed)
  }

  private async getIncreaseLiquidityTx(liquidityInput: IncreaseLiquidityInput, positionId: PublicKey, positionNftMint: PublicKey, swapKey: PublicKey, isAFixed: boolean) {
    const clmmpool = await this.fetcher.getPool(swapKey, true);
    if (!clmmpool) {
      throw new Error("Unable to fetch clmmpool for this position.");
    }
    const { tokenMaxA: tokenAMax, tokenMaxB: tokenBMax, liquidityAmount: delta_liquidity } = liquidityInput
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

    const tickUpper = this.data.tickUpperIndex  
    const tickLower = this.data.tickLowerIndex
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

    const tickArrayMap = PDAUtil.getTickArrayMapPDA(this.ctx.program.programId, swapKey).publicKey

    const instructions = []
    const tickArrayInstructions = []
    const isTickLowerArrayInit = TickArrayUtil.isTickArrayInitialized(tickArrayLower, this.ctx.provider)
    if (!isTickLowerArrayInit) {
      const initTickArrayIx = ClmmpoolIx.createTickArrayIx(this.ctx.program, {
        arrayIndex: TickUtil.getArrayIndex(tickLower, clmmpool.tickSpacing),
        payer: this.ctx.provider.wallet.publicKey,
        clmmpool: swapKey,
        tickArray: tickArrayLower
      })
      tickArrayInstructions.push(initTickArrayIx)
    }
    if (tickArrayLower != tickArrayUpper) {
      const isTickUpperArrayInit = TickArrayUtil.isTickArrayInitialized(tickArrayUpper, this.ctx.provider)
      if (!isTickUpperArrayInit) {
        const initTickArrayIx = ClmmpoolIx.createTickArrayIx(this.ctx.program, {
          arrayIndex: TickUtil.getArrayIndex(tickUpper, clmmpool.tickSpacing),
          payer: this.ctx.provider.wallet.publicKey,
          clmmpool: swapKey,
          tickArray: tickArrayUpper
        })
        tickArrayInstructions.push(initTickArrayIx)
      }
    }
    instructions.push(...tickArrayInstructions)

    const liquidityInputWithFixedToken = {
      tokenA: tokenAMax,
      tokenB: tokenBMax,
      isAFixed
    }
    const increaseLiquidityParams = {
      liquidityInputWithFixedToken,
      owner: wallet,
      clmmpool: swapKey,
      position: positionId,
      positionAta: positionAta.accounts.positionAddress,
      tokenAAta: accountATAs.accounts.tokenA,
      tokenBAta: accountATAs.accounts.tokenB,
      tokenAVault: clmmpool.tokenAVault,
      tokenBVault: clmmpool.tokenBVault,
      tickArrayLower,
      tickArrayUpper,
      tickArrayMap
    }

    const liquidityIx = ClmmpoolIx.increaseLiquidityWithFixedTokenIx(this.ctx.program, increaseLiquidityParams);
    instructions.push(liquidityIx)
    if (
      clmmpool.tokenA.equals(NATIVE_MINT) &&
      tokenAMax.gt(new BN(0))
    ) {
      const wrapSOLInstructions = await TokenUtil.wrapSOL(this.ctx.provider, new Decimal(tokenAMax.toString()));
      instructions.unshift(...wrapSOLInstructions.instructions);
      const unwrapSOLInstructions = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenA);
      instructions.push(...unwrapSOLInstructions.instructions);
    }
    if (
      clmmpool.tokenB.equals(NATIVE_MINT) &&
      tokenBMax.gt(new BN(0))
    ) {
      const wrapSOLInstructions = await TokenUtil.wrapSOL(this.ctx.provider, new Decimal(tokenBMax.toString()));
      instructions.unshift(...wrapSOLInstructions.instructions);
      const unwrapSOLInstructions = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenB);
      instructions.push(...unwrapSOLInstructions.instructions);
    }

    instructions.unshift(...accountATAs.instructions)
    return new TransactionEnvelope(this.ctx.provider, instructions)
  }

  async decreaseLiquidity(liquidityInput: DecreaseLiquidityInput, positionId: PublicKey, positionNftMint: PublicKey, swapKey: PublicKey) {
    await this.refreshData()
    return this.getDecreaseLiquidityTx(liquidityInput, positionId, positionNftMint, swapKey)
  }

  private async getDecreaseLiquidityTx(liquidityInput: DecreaseLiquidityInput, positionId: PublicKey, positionNftMint: PublicKey, swapKey: PublicKey) {
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

    const tickUpper = this.data.tickUpperIndex
    const tickLower = this.data.tickLowerIndex  
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
    const tickArrayMap = PDAUtil.getTickArrayMapPDA(this.ctx.program.programId, swapKey).publicKey
    const decreaseLiquidityInstructions = []
    const decreaseLiquidityIx = ClmmpoolIx.decreaseLiquidityIx(this.ctx.program, {
      liquidityInput,
      owner: wallet,
      clmmpool: swapKey,
      position: positionId,
      positionAta: positionAta.accounts.positionAddress,
      tokenAAta: accountATAs.accounts.tokenA,
      tokenBAta: accountATAs.accounts.tokenB,
      tokenAVault: clmmpool.tokenAVault,
      tokenBVault: clmmpool.tokenBVault,
      tickArrayLower,
      tickArrayUpper,
      tickArrayMap,
    })
    decreaseLiquidityInstructions.push(decreaseLiquidityIx)
    decreaseLiquidityInstructions.unshift(...accountATAs.instructions)
    
    const instructions = []
    if (
      clmmpool.tokenA.equals(NATIVE_MINT)
    ) {
      const unwrapSOLInstructions = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenA);
      instructions.push(...unwrapSOLInstructions.instructions);
    }
    if (
      clmmpool.tokenB.equals(NATIVE_MINT)
    ) {
      const unwrapSOLInstructions = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenB);
      instructions.push(...unwrapSOLInstructions.instructions);
    }
    decreaseLiquidityInstructions.push(...instructions)
    return new TransactionEnvelope(this.ctx.provider, decreaseLiquidityInstructions)

  }
  async claim(positionId: PublicKey, positionNftMint: PublicKey, swapKey: PublicKey) {
    await this.refreshData()
    return this.getClaimTx(positionId, positionNftMint, swapKey)
  }
  private async getClaimTx(positionId: PublicKey, positionNftMint: PublicKey, swapKey: PublicKey) {

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
      owner: this.ctx.provider.wallet.publicKey
    })

    const tickUpper = this.data.tickUpperIndex
    const tickLower = this.data.tickLowerIndex
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
    const claimInstructions = []
    const cliamIx = ClmmpoolIx.collectFeeIx(this.ctx.program, {
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
      })

    claimInstructions.push(cliamIx)
    claimInstructions.unshift(...accountATAs.instructions)
    const instructions = []
    if (
      clmmpool.tokenA.equals(NATIVE_MINT)
    ) {
      const unwrapSOLInstructions = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenA);
      instructions.push(...unwrapSOLInstructions.instructions);
    }
    if (
      clmmpool.tokenB.equals(NATIVE_MINT)
    ) {
      const unwrapSOLInstructions = await TokenUtil.unwrapSOL(this.ctx.provider, accountATAs.accounts.tokenB);
      instructions.push(...unwrapSOLInstructions.instructions);
    }
    claimInstructions.push(...instructions)
     return new TransactionEnvelope(this.ctx.provider, claimInstructions)

  }

  private async refresh() {
    const account = await this.fetcher.getPosition(this.address, true);
    if (account) {
      this.data = account;
    }
  }
}
