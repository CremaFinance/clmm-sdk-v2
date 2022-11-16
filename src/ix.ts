import type { BN, Program } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import type { u64 } from "@solana/spl-token";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";

import type { clmmpool } from "./idls/clmmpool";
import type { DecreaseLiquidityInput } from "./types";
import {
  METADATA_PROGRAM_ADDRESS,
  MINT_WRAPPER_PROGRAM_ID,
} from "./types/constants";
import { PDAUtil } from "./utils";
import type * as addressUtil from "./utils/address-util";

export type SwapInput = {
  aToB: boolean;
  byAmountIn: boolean;
  amount: BN;
  amountLimit: BN;
  extraComputeLimit: number;
};

export type SwapWithPartnerParams = {
  aToB: boolean;
  byAmountIn: boolean;
  amount: u64;
  amountLimit: u64;
  sqrtPriceLimit: BN;
  clmmConfig: PublicKey;
  clmmpool: PublicKey;
  tokenA: PublicKey;
  tokenB: PublicKey;
  accountA: PublicKey;
  accountB: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
  tickArrayMap: PublicKey;
  owner: PublicKey;
  partner: PublicKey;
  partnerAtaA: PublicKey;
  partnerAtaB: PublicKey;
  tickArrays: PublicKey[];
};

export type OpenPositionParams = {
  tickLowerIndex: number;
  tickUpperIndex: number;
  owner: PublicKey;
  clmmpool: PublicKey;
  position: PublicKey;
  positionNftMint: PublicKey;
  positionMetadataAccount: PublicKey;
  positionEdition: PublicKey;
  positionNftUpdateAuthority: PublicKey;
  positionAta: PublicKey;
};

export type InitClmmConfigParams = {
  clmmConfig: PublicKey;
  protocolAuthority: PublicKey;
  protocolFeeClaimAuthority: PublicKey;
  createPoolAuthority: PublicKey;
  protocolFeeRate: number;
  payer: PublicKey;
};

export type CreateFeeTierParams = {
  tickSpacing: number;
  feeRate: number;
  payer: PublicKey;
  clmmConfig: PublicKey;
  feeTier: PublicKey;
  feeAuthority: PublicKey;
  feeTierPDA: addressUtil.PDA;
};

export type CreateClmmpoolParams = {
  initSqrtPrice: BN;
  tickSpacing: number;
  payer: PublicKey;
  clmmConfig: PublicKey;
  feeTier: PublicKey;
  clmmpool: PublicKey;
  tokenA: PublicKey;
  tokenB: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
};

export type CreateTickArrayParams = {
  arrayIndex: number; //the index of tick array
  payer: PublicKey;
  clmmpool: PublicKey;
  tickArray: PublicKey;
};

export type CreateTickArrayMapParams = {
  payer: PublicKey;
  clmmpool: PublicKey;
  tickArrayMap: PublicKey;
};

export type CreatePartnerParams = {
  payer: PublicKey;
  clmmConfig: PublicKey;
  protocolAuthority: PublicKey;
  base: PublicKey;
  partner: PublicKey;
  authority: PublicKey;
  partner_fee_claim_authority: PublicKey;
  fee_rate: number;
  start_time: BN;
  end_time: BN;
  name: string;
};

export type UpdatePartnerParams = {
  clmmConfig: PublicKey;
  partner: PublicKey;
  authority: PublicKey;
  new_fee_rate: number;
  new_claim_authority: PublicKey;
};

export type UpdateConfigProtocolFeeRateParams = {
  clmmpool: PublicKey;
  clmmConfig: PublicKey;
  protocolAuthority: PublicKey;
};

export type IncreaseLiquidityInput = {
  delta_liquidity: BN;
  tokenAMax: BN;
  tokenBMax: BN;
};

export type IncreaseLiquidityInputWithFixedToken = {
  tokenA: BN;
  tokenB: BN;
  isAFixed: boolean;
};

export type InitializeRewarderParams = {
  rewarderIndex: number;
  mintWrapper: PublicKey;
  minter: PublicKey;
  payer: PublicKey;
  clmmConfig: PublicKey;
  clmmpool: PublicKey;
  rewarderAuthority: PublicKey;
  rewarderTokenMint: PublicKey;
};

export type IncreaseLiquidityParams = {
  liquidityInput: IncreaseLiquidityInput;
  owner: PublicKey;
  clmmpool: PublicKey;
  position: PublicKey;
  positionAta: PublicKey;
  tokenAAta: PublicKey;
  tokenBAta: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
  tickArrayLower: PublicKey;
  tickArrayUpper: PublicKey;
  tickArrayMap: PublicKey;
};

export type IncreaseLiquidityWithFixedTokenParams = {
  liquidityInputWithFixedToken: IncreaseLiquidityInputWithFixedToken;
  owner: PublicKey;
  clmmpool: PublicKey;
  position: PublicKey;
  positionAta: PublicKey;
  tokenAAta: PublicKey;
  tokenBAta: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
  tickArrayLower: PublicKey;
  tickArrayUpper: PublicKey;
  tickArrayMap: PublicKey;
};

export type DecreaseLiquidityParams = {
  liquidityInput: DecreaseLiquidityInput;
  owner: PublicKey;
  clmmpool: PublicKey;
  position: PublicKey;
  positionAta: PublicKey;
  tokenAAta: PublicKey;
  tokenBAta: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
  tickArrayLower: PublicKey;
  tickArrayUpper: PublicKey;
  tickArrayMap: PublicKey;
};

export class ClmmpoolIx {
  /**
   * Accept the protocol administrator
   * @param program
   * @param params
   * @returns
   */
  static acceptProtocolAuthorityIx(
    program: Program<clmmpool>,
    params: {
      newAuthority: PublicKey;
      clmmConfig: PublicKey;
    }
  ): TransactionInstruction {
    const { newAuthority, clmmConfig } = params;
    const ix = program.instruction.acceptProtocolAuthority({
      accounts: {
        newAuthority,
        clmmConfig,
      },
    });
    return ix;
  }

  /**
   * The user claims the fee
   * @param program
   * @param params
   * @returns
   */
  static collectFeeIx(
    program: Program<clmmpool>,
    params: {
      owner: PublicKey;
      clmmpool: PublicKey;
      position: PublicKey;
      positionAta: PublicKey;
      tokenAAta: PublicKey;
      tokenBAta: PublicKey;
      tokenAVault: PublicKey;
      tokenBVault: PublicKey;
      tickArrayLower: PublicKey;
      tickArrayUpper: PublicKey;
    }
  ): TransactionInstruction {
    const ix = program.instruction.collectFee({
      accounts: {
        owner: params.owner,
        clmmpool: params.clmmpool,
        position: params.position,
        positionAta: params.positionAta,
        tokenAAta: params.tokenAAta,
        tokenBAta: params.tokenBAta,
        tokenAVault: params.tokenAVault,
        tokenBVault: params.tokenBVault,
        tickArrayLower: params.tickArrayLower,
        tickArrayUpper: params.tickArrayUpper,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
    return ix;
  }

  /**
   * Collect partner fee instruction.
   * @param program
   * @param params
   * @returns
   */
  static collectPartnerFeeIx(
    program: Program<clmmpool>,
    params: {
      partnerFeeClaimAuthority: PublicKey;
      partner: PublicKey;
      clmmpool: PublicKey;
      tokenAAta: PublicKey;
      tokenBAta: PublicKey;
      tokenAPartnerFeeVault: PublicKey;
      tokenBPartnerFeeVault: PublicKey;
    }
  ): TransactionInstruction {
    const ix = program.instruction.collectPartnerFee({
      accounts: {
        partnerFeeClaimAuthority: params.partnerFeeClaimAuthority,
        partner: params.partner,
        clmmpool: params.clmmpool,
        tokenAAta: params.tokenAAta,
        tokenBAta: params.tokenBAta,
        tokenAPartnerFeeVault: params.tokenAPartnerFeeVault,
        tokenBPartnerFeeVault: params.tokenBPartnerFeeVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
    return ix;
  }

  /**
   * Claim the protocol fee earned by the pool
   * @param program
   * @param params
   * @returns
   */
  static collectProtocolFeeIx(
    program: Program<clmmpool>,
    params: {
      protocolFeeClaimAuthority: PublicKey;
      clmmConfig: PublicKey;
      clmmpool: PublicKey;
      tokenAAta: PublicKey;
      tokenBAta: PublicKey;
      tokenAVault: PublicKey;
      tokenBVault: PublicKey;
    }
  ): TransactionInstruction {
    const ix = program.instruction.collectProtocolFee({
      accounts: {
        protocolFeeClaimAuthority: params.protocolFeeClaimAuthority,
        clmmpool: params.clmmpool,
        clmmConfig: params.clmmConfig,
        tokenAAta: params.tokenAAta,
        tokenBAta: params.tokenBAta,
        tokenAVault: params.tokenAVault,
        tokenBVault: params.tokenBVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
    return ix;
  }

  /**
   * Claim the rewarder earned by the pool
   * @param program
   * @param params
   * @returns
   */
  static collectRewarderIx(
    program: Program<clmmpool>,
    params: {
      owner: PublicKey;
      clmmpool: PublicKey;
      position: PublicKey;
      positionAta: PublicKey;
      rewarderAta: PublicKey;
      mintWrapper: PublicKey;
      minter: PublicKey;
      rewardsTokenMint: PublicKey;
      tickArrayLower: PublicKey;
      tickArrayUpper: PublicKey;
      rewarderIndex: number;
    }
  ): TransactionInstruction {
    const ix = program.instruction.collectRewarder(params.rewarderIndex, {
      accounts: {
        owner: params.owner,
        clmmpool: params.clmmpool,
        position: params.position,
        positionAta: params.positionAta,
        rewarderAta: params.rewarderAta,
        mintWrapper: params.mintWrapper,
        minter: params.minter,
        mintWrapperProgram: MINT_WRAPPER_PROGRAM_ID,
        rewardsTokenMint: params.rewardsTokenMint,
        tickArrayLower: params.tickArrayLower,
        tickArrayUpper: params.tickArrayUpper,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
    return ix;
  }

  /**
   * Create a pool
   * @param program
   * @param params
   * @returns
   */
  static createClmmpoolIx(
    program: Program<clmmpool>,
    params: CreateClmmpoolParams
  ): TransactionInstruction {
    const {
      initSqrtPrice: initSqrtPrice,
      payer,
      clmmConfig,
      feeTier,
      clmmpool,
      tokenA,
      tokenB,
      tokenAVault,
      tokenBVault,
    } = params;
    const ix = program.instruction.createClmmpool(initSqrtPrice, {
      accounts: {
        payer,
        clmmConfig,
        feeTier,
        clmmpool,
        tokenA,
        tokenB,
        tokenAVault,
        tokenBVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
    });
    return ix;
  }

  /**
   * Create a ClmmConfig account that hosts info & authorities
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - InitConfigParams object
   * @returns - Instruction to perform the action.
   */
  static createClmmConfigIx(
    program: Program<clmmpool>,
    params: {
      protocolAuthority: PublicKey;
      protocolFeeClaimAuthority: PublicKey;
      createPoolAuthority: PublicKey;
      protocolFeeRate: number;
      payer: PublicKey;
      clmmConfig: PublicKey;
    }
  ): TransactionInstruction {
    const {
      protocolAuthority,
      protocolFeeClaimAuthority,
      createPoolAuthority,
      protocolFeeRate,
      payer,
      clmmConfig,
    } = params;
    const ix = program.instruction.initializeClmmConfig(
      protocolAuthority,
      protocolFeeClaimAuthority,
      createPoolAuthority,
      protocolFeeRate,
      {
        accounts: {
          payer,
          clmmConfig: clmmConfig,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        },
      }
    );
    return ix;
  }

  /**
   * Creating a fee tier
   * @param program
   * @param params
   * @returns
   */
  static createFeeTierIx(
    program: Program<clmmpool>,
    params: {
      tickSpacing: number;
      feeRate: number;
      payer: PublicKey; //gas payer
      clmmConfig: PublicKey;
      feeTier: PublicKey; //pda
      protocolAuthority: PublicKey; //clmmconfig protocolAuthority
    }
  ): TransactionInstruction {
    const {
      tickSpacing,
      feeRate,
      payer,
      clmmConfig,
      feeTier,
      protocolAuthority,
    } = params;
    const ix = program.instruction.createFeeTier(tickSpacing, feeRate, {
      accounts: {
        payer,
        clmmConfig,
        feeTier,
        protocolAuthority,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
      },
    });
    return ix;
  }

  /**
   * Creating a partner
   * @param program
   * @param params
   * @returns
   */
  static createPartnerIx(
    program: Program<clmmpool>,
    params: CreatePartnerParams
  ): TransactionInstruction {
    const ix = program.instruction.createPartner(
      params.authority,
      params.partner_fee_claim_authority,
      params.fee_rate,
      params.start_time,
      params.end_time,
      params.name,
      {
        accounts: {
          payer: params.payer,
          clmmConfig: params.clmmConfig,
          protocolAuthority: params.protocolAuthority,
          base: params.base,
          partner: params.partner,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        },
      }
    );
    return ix;
  }

  /**
   * Create a tick array. If the tick array at the edge of the position does not exist when the user opens the position,
   * @param program
   * @param params
   * @returns
   */
  static createTickArrayIx(
    program: Program<clmmpool>,
    params: CreateTickArrayParams
  ): TransactionInstruction {
    const { arrayIndex, payer, clmmpool, tickArray } = params;
    const ix = program.instruction.createTickArray(arrayIndex, {
      accounts: {
        payer,
        clmmpool,
        tickArray,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
    });
    return ix;
  }

  /**
   * Create a tick array map. There is only one tick array map.
   * @param program
   * @param params
   * @returns
   */
  static createTickArrayMapIx(
    program: Program<clmmpool>,
    params: CreateTickArrayMapParams
  ): TransactionInstruction {
    const { payer, clmmpool, tickArrayMap } = params;
    const ix = program.instruction.createTickArrayMap({
      accounts: {
        payer,
        clmmpool,
        tickArrayMap,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
    });
    return ix;
  }

  /**
   * Reduce liquidity by removing some or all of the liquidity from a known position
   * @param program
   * @param params
   * @returns
   */
  static decreaseLiquidityIx(
    program: Program<clmmpool>,
    params: DecreaseLiquidityParams
  ): TransactionInstruction {
    const { liquidityAmount, tokenMinA, tokenMinB } = params.liquidityInput;
    const ix = program.instruction.decreaseLiquidity(
      liquidityAmount,
      tokenMinA,
      tokenMinB,
      {
        accounts: {
          owner: params.owner,
          clmmpool: params.clmmpool,
          tokenProgram: TOKEN_PROGRAM_ID,
          position: params.position,
          positionAta: params.positionAta,
          tokenAAta: params.tokenAAta,
          tokenBAta: params.tokenBAta,
          tokenAVault: params.tokenAVault,
          tokenBVault: params.tokenBVault,
          tickArrayLower: params.tickArrayLower,
          tickArrayUpper: params.tickArrayUpper,
          tickArrayMap: params.tickArrayMap,
        },
      }
    );
    return ix;
  }

  /**
   * Increase liquidity, provided that positions have been opened; Add liquidity to a position
   * @param program
   * @param params
   * @returns
   */
  static increaseLiquidity(
    program: Program<clmmpool>,
    params: IncreaseLiquidityParams
  ): TransactionInstruction {
    const { delta_liquidity, tokenAMax, tokenBMax } = params.liquidityInput;
    const ix = program.instruction.increaseLiquidity(
      delta_liquidity,
      tokenAMax,
      tokenBMax,
      {
        accounts: {
          owner: params.owner,
          clmmpool: params.clmmpool,
          position: params.position,
          positionAta: params.positionAta,
          tokenAAta: params.tokenAAta,
          tokenBAta: params.tokenBAta,
          tokenAVault: params.tokenAVault,
          tokenBVault: params.tokenBVault,
          tickArrayLower: params.tickArrayLower,
          tickArrayUpper: params.tickArrayUpper,
          tickArrayMap: params.tickArrayMap,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
    return ix;
  }

  /**
   * Increase liquidity with fixed token, provided that positions have been opened; Add liquidity to a position
   * @param program
   * @param params
   * @returns
   */
  static increaseLiquidityWithFixedTokenIx(
    program: Program<clmmpool>,
    params: IncreaseLiquidityWithFixedTokenParams
  ): TransactionInstruction {
    const { isAFixed, tokenA, tokenB } = params.liquidityInputWithFixedToken;
    const ix = program.instruction.increaseLiquidityWithFixedToken(
      tokenA,
      tokenB,
      isAFixed,
      {
        accounts: {
          owner: params.owner,
          clmmpool: params.clmmpool,
          position: params.position,
          positionAta: params.positionAta,
          tokenAAta: params.tokenAAta,
          tokenBAta: params.tokenBAta,
          tokenAVault: params.tokenAVault,
          tokenBVault: params.tokenBVault,
          tickArrayLower: params.tickArrayLower,
          tickArrayUpper: params.tickArrayUpper,
          tickArrayMap: params.tickArrayMap,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
    return ix;
  }

  /**
   * Increase liquidity, provided that positions have been opened; Add liquidity to a position
   * @param program
   * @param params
   * @returns
   */
  static initializeRewarderIx(
    program: Program<clmmpool>,
    params: InitializeRewarderParams
  ): TransactionInstruction {
    const ix = program.instruction.initializeRewarder(
      params.rewarderIndex,
      params.mintWrapper,
      params.minter,
      {
        accounts: {
          payer: params.payer,
          clmmConfig: params.clmmConfig,
          clmmpool: params.clmmpool,
          rewarderAuthority: params.rewarderAuthority,
          rewarderTokenMint: params.rewarderTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
      }
    );
    return ix;
  }

  /**
   * Users open positions
   * @param program
   * @param params
   * @returns
   */
  static openPositionIx(
    program: Program<clmmpool>,
    params: OpenPositionParams
  ): TransactionInstruction {
    const {
      tickLowerIndex,
      tickUpperIndex,
      owner,
      clmmpool,
      position,
      positionNftMint,
      positionMetadataAccount,
      positionEdition,
      positionAta,
    } = params;

    const clmmpool_metadata = PDAUtil.getClmmpoolMetadataPDA(program.programId, clmmpool).publicKey;

    const remainingAccounts = [];
    const matedata = program.provider.connection.getAccountInfo(clmmpool_metadata);
    if (matedata !== null) {
      remainingAccounts.push(
        {
          pubkey: clmmpool_metadata,
          isWritable: false,
          isSigner: false,
        })
    }

    const ix = program.instruction.openPosition(
      tickLowerIndex,
      tickUpperIndex,
      {
        accounts: {
          owner,
          clmmpool,
          position,
          positionNftMint,
          positionMetadataAccount,
          positionEdition,
          positionAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          metadataProgram: METADATA_PROGRAM_ADDRESS,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        remainingAccounts,
      }
    );
    return ix;
  }

  /**
   * Remove position, position has no liquidity, handling fee, etc., can be removed
   * @param program
   * @param params
   * @returns
   */
  static removePositionIx(
    program: Program<clmmpool>,
    params: {
      owner: PublicKey;
      position: PublicKey;
      positionNftMint: PublicKey;
      positionAta: PublicKey;
      positionMetadataAccount: PublicKey;
      positionEdition: PublicKey;
    }
  ): TransactionInstruction {
    const {
      owner,
      position,
      positionNftMint,
      positionAta,
      positionMetadataAccount,
      positionEdition,
    } = params;
    const ix = program.instruction.removePosition({
      accounts: {
        owner,
        position,
        positionNftMint,
        positionAta,
        positionMetadataAccount,
        positionEdition,
        tokenProgram: TOKEN_PROGRAM_ID,
        metadataProgram: METADATA_PROGRAM_ADDRESS,
      },
    });
    return ix;
  }

  /**
   * Perform a swap in this Clmmpool
   * @param program
   * @param params
   * @returns
   */
  static swapIx(
    program: Program<clmmpool>,
    params: {
      aToB: boolean;
      byAmountIn: boolean;
      amount: u64;
      amountLimit: u64;
      sqrtPriceLimit: BN;
      clmmConfig: PublicKey;
      clmmpool: PublicKey;
      tokenA: PublicKey;
      tokenB: PublicKey;
      accountA: PublicKey;
      accountB: PublicKey;
      tokenAVault: PublicKey;
      tokenBVault: PublicKey;
      tickArrayMap: PublicKey;
      owner: PublicKey;
      tickArrays: PublicKey[];
    }
  ): TransactionInstruction {
    const {
      aToB,
      byAmountIn,
      amount,
      amountLimit,
      sqrtPriceLimit,
      clmmConfig,
      clmmpool,
      tokenA,
      tokenB,
      accountA,
      accountB,
      tokenAVault,
      tokenBVault,
      tickArrayMap,
      owner,
      tickArrays,
    } = params;

    const remainingAccounts: {
      pubkey: PublicKey;
      isWritable: boolean;
      isSigner: boolean;
    }[] = [];

    for (let i = 0; i < tickArrays.length; i++) {
      remainingAccounts.push({
        pubkey: tickArrays[i]!,
        isWritable: true,
        isSigner: false,
      });
    }

    const ix = program.instruction.swap(
      aToB,
      byAmountIn,
      amount,
      amountLimit,
      sqrtPriceLimit,
      {
        accounts: {
          clmmConfig,
          clmmpool,
          tokenA,
          tokenB,
          accountA,
          accountB,
          tokenAVault,
          tokenBVault,
          tickArrayMap,
          owner,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        remainingAccounts,
      }
    );
    return ix;
  }

  /**
   * Perform a swap in this Clmmpool
   * @param program
   * @param params
   * @returns
   */
  static swapWithPartnerIx(
    program: Program<clmmpool>,
    params: SwapWithPartnerParams
  ): TransactionInstruction {
    const {
      aToB,
      byAmountIn,
      amount,
      amountLimit,
      sqrtPriceLimit,
      clmmConfig,
      clmmpool,
      tokenA,
      tokenB,
      accountA,
      accountB,
      tokenAVault,
      tokenBVault,
      tickArrayMap,
      owner,
      partner,
      partnerAtaA,
      partnerAtaB,
      tickArrays,
    } = params;
    const remainingAccounts: {
      pubkey: PublicKey;
      isWritable: boolean;
      isSigner: boolean;
    }[] = [];

    for (let i = 0; i < tickArrays.length; i++) {
      remainingAccounts.push({
        pubkey: tickArrays[i]!,
        isWritable: true,
        isSigner: false,
      });
    }

    const ix = program.instruction.swapWithPartner(
      aToB,
      byAmountIn,
      amount,
      amountLimit,
      sqrtPriceLimit,
      {
        accounts: {
          clmmConfig,
          clmmpool,
          tokenA,
          tokenB,
          accountA,
          accountB,
          tokenAVault,
          tokenBVault,
          tickArrayMap,
          owner,
          partner,
          partnerAtaA,
          partnerAtaB,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        remainingAccounts,
      }
    );
    return ix;
  }

  /**
   * Fee for renewing the pool
   * @param program
   * @param params
   * @returns
   */
  static updateFeeRateIx(
    program: Program<clmmpool>,
    params: {
      newFeeRate: number;
      protocolAuthority: PublicKey;
      clmmConfig: PublicKey;
      clmmpool: PublicKey;
    }
  ): TransactionInstruction {
    const { newFeeRate, protocolAuthority, clmmConfig, clmmpool } = params;
    const ix = program.instruction.updateFeeRate(newFeeRate, {
      accounts: {
        protocolAuthority,
        clmmConfig,
        clmmpool,
      },
    });
    return ix;
  }

  /**
   * Update partner
   * @param program
   * @param params
   */
  static updatePartnerIx(
    program: Program<clmmpool>,
    params: UpdatePartnerParams
  ): TransactionInstruction {
    const ix = program.instruction.updatePartner(
      params.new_fee_rate,
      params.new_claim_authority,
      {
        accounts: {
          clmmConfig: params.clmmConfig,
          partner: params.partner,
          authority: params.authority,
        },
      }
    );
    return ix;
  }

  /**
   * Update the pool's agreed rate
   * @param program
   * @param params
   * @returns
   */
  static updateRewarderEmissionIx(
    program: Program<clmmpool>,
    params: {
      rewarderIndex: number;
      emissionsPerSecond: BN;
      rewarderAuthority: PublicKey;
      clmmConfig: PublicKey;
      clmmpool: PublicKey;
    }
  ): TransactionInstruction {
    const { rewarderIndex, emissionsPerSecond, rewarderAuthority, clmmConfig, clmmpool } =
      params;

    const ix = program.instruction.updateRewarderEmission(
      rewarderIndex,
      emissionsPerSecond,
      {
        accounts: {
          rewarderAuthority,
          clmmConfig,
          clmmpool,
        },
      }
    );
    return ix;
  }

  /**
   * Pause clmmpool
   * @param program
   * @param params
   * @returns
   */
  static pauseClmmpoolIx(
    program: Program<clmmpool>,
    params: {
      clmmConfig: PublicKey;
      protocolAuthority: PublicKey;
      clmmpool: PublicKey;
    }
  ): TransactionInstruction {
    const { clmmConfig, protocolAuthority, clmmpool } = params;
    const ix = program.instruction.pauseClmmpool({
      accounts: {
        clmmConfig,
        protocolAuthority,
        clmmpool,
      },
    });
    return ix;
  }

  /**
   * UnPause clmmpool
   * @param program
   * @param params
   * @returns
   */
  static unPauseClmmpoolIx(
    program: Program<clmmpool>,
    params: {
      clmmConfig: PublicKey;
      protocolAuthority: PublicKey;
      clmmpool: PublicKey;
    }
  ): TransactionInstruction {
    const { clmmConfig, protocolAuthority, clmmpool } = params;
    const ix = program.instruction.unpauseClmmpool({
      accounts: {
        clmmConfig,
        protocolAuthority,
        clmmpool,
      },
    });
    return ix;
  }
}
