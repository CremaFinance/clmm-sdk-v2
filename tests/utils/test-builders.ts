// import * as anchor from "@project-serum/anchor";
import { getOrCreateATA } from "@cremafinance/token-utils";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import type BN from "bn.js";
import Decimal from "decimal.js";

import type {
  CreateClmmpoolParams,
  CreateFeeTierParams,
  CreatePartnerParams,
  CreateTickArrayMapParams,
  CreateTickArrayParams,
  InitClmmConfigParams,
  OpenPositionParams,
} from "../../src";
import { PDAUtil } from "../../src";
import type { ClmmpoolContext } from "../../src/context";
import { MathUtil } from "../../src/math/utils";
import { POSITION_NFT_UPDATE_AUTHORITY } from "../../src/types";
import { createMint } from ".";

export interface TestClmmpoolsConfigKeypairs {
  protocolAuthorityKeypair: Keypair;
  protocolClaimAuthorityKeypair: Keypair;
  createPoolAuthorityKeypair: Keypair;
}

export interface TestTokenVaultsKeypairs {
  tokenAVaultKeypair: Keypair;
  tokenBVaultKeypair: Keypair;
}

export const generateDefaultConfigParams = (
  context: ClmmpoolContext,
  payer?: PublicKey
): {
  configInitInfo: InitClmmConfigParams;
  configKeypairs: TestClmmpoolsConfigKeypairs;
} => {
  const configKeypairs: TestClmmpoolsConfigKeypairs = {
    protocolAuthorityKeypair: Keypair.generate(),
    protocolClaimAuthorityKeypair: Keypair.generate(),
    createPoolAuthorityKeypair: Keypair.generate(),
  };

  const createPoolAuthority = PDAUtil.getClmmConfigPDA(
    context.program.programId
  );

  const configInitInfo = {
    clmmConfig: createPoolAuthority.publicKey,
    protocolAuthority: configKeypairs.protocolAuthorityKeypair.publicKey,
    protocolFeeClaimAuthority:
      configKeypairs.protocolClaimAuthorityKeypair.publicKey,
    createPoolAuthority: configKeypairs.createPoolAuthorityKeypair.publicKey,
    protocolFeeRate: 300,
    payer: payer || context.wallet.publicKey,
  };
  return { configInitInfo, configKeypairs };
};

export const createInOrderMints = async (
  context: ClmmpoolContext
): Promise<[PublicKey, PublicKey]> => {
  const provider = context.provider;
  const tokenXMintPubKey = await createMint(provider);
  const tokenYMintPubKey = await createMint(provider);

  let tokenMintAPubKey, tokenMintBPubKey;
  if (
    Buffer.compare(tokenXMintPubKey.toBuffer(), tokenYMintPubKey.toBuffer()) < 0
  ) {
    tokenMintAPubKey = tokenXMintPubKey;
    tokenMintBPubKey = tokenYMintPubKey;
  } else {
    tokenMintAPubKey = tokenYMintPubKey;
    tokenMintBPubKey = tokenXMintPubKey;
  }

  return [tokenMintAPubKey, tokenMintBPubKey];
};

export const generateDefaultCreatePoolParams = async (
  context: ClmmpoolContext,
  configPubkey: PublicKey,
  feeTierPubkey: PublicKey,
  tickSpacing: number,
  initSqrtPrice = MathUtil.toX64(new Decimal(5)),
  payer?: PublicKey
): Promise<{
  poolCreateInfo: CreateClmmpoolParams;
}> => {
  const [tokenMintAPubKey, tokenMintBPubKey] = await createInOrderMints(
    context
  );

  const clmmpoolPDA = PDAUtil.getClmmpoolPDA(
    context.program.programId,
    configPubkey,
    tokenMintAPubKey,
    tokenMintBPubKey,
    tickSpacing
  );

  const tokenAVaultATA = await getOrCreateATA({
    provider: context.provider,
    mint: tokenMintAPubKey,
    owner: clmmpoolPDA.publicKey,
  });

  const tokenBVaultATA = await getOrCreateATA({
    provider: context.provider,
    mint: tokenMintBPubKey,
    owner: clmmpoolPDA.publicKey,
  });

  const poolCreateInfo = {
    initSqrtPrice,
    tickSpacing,
    clmmConfig: configPubkey,
    tokenA: tokenMintAPubKey,
    tokenB: tokenMintBPubKey,
    clmmpool: clmmpoolPDA.publicKey,
    tokenAVault: tokenAVaultATA.address,
    tokenBVault: tokenBVaultATA.address,
    feeTier: feeTierPubkey,
    payer: payer || context.wallet.publicKey,
  };

  return { poolCreateInfo };
};

export const generateDefaultInitFeeTierParams = (
  context: ClmmpoolContext,
  clmmConfig: PublicKey,
  feeAuthority: PublicKey,
  tickSpacing: number,
  feeRate: number,
  feeTier: PublicKey,
  payer?: PublicKey
): CreateFeeTierParams => {
  const feeTierPDA = PDAUtil.getFeeTierPDA(
    context.program.programId,
    clmmConfig,
    tickSpacing
  );
  return {
    payer: payer || context.wallet.publicKey,
    clmmConfig,
    feeTierPDA,
    feeRate,
    feeTier,
    feeAuthority,
    tickSpacing,
  };
};

export const generateDefaultInitTickArrayParams = (
  context: ClmmpoolContext,
  clmmpool: PublicKey,
  arrayIndex: number,
  payer?: PublicKey
): CreateTickArrayParams => {
  const tickArrayPDA = PDAUtil.getTickArrayPDA(
    context.program.programId,
    clmmpool,
    arrayIndex
  );

  return {
    clmmpool,
    tickArray: tickArrayPDA.publicKey,
    arrayIndex,
    payer: payer || context.wallet.publicKey,
  };
};

export const generateDefaultInitTickArrayMapParams = (
  context: ClmmpoolContext,
  clmmpool: PublicKey,
  payer?: PublicKey
): CreateTickArrayMapParams => {
  const tickArrayMapPDA = PDAUtil.getTickArrayMapPDA(
    context.program.programId,
    clmmpool
  );

  return {
    clmmpool,
    tickArrayMap: tickArrayMapPDA.publicKey,
    payer: payer || context.wallet.publicKey,
  };
};

export const generateDefaultCreatePartnerParams = (
  context: ClmmpoolContext,
  base: PublicKey,
  clmmConfig: PublicKey,
  protocolAuthority: PublicKey,
  authority: PublicKey,
  partner_fee_claim_authority: PublicKey,
  fee_rate: number,
  start_time: BN,
  end_time: BN,
  name: string,
  payer?: PublicKey
): CreatePartnerParams => {
  const partnerPDA = PDAUtil.getPartnerPDA(context.program.programId, base);

  return {
    payer: payer || context.wallet.publicKey,
    clmmConfig,
    protocolAuthority,
    base,
    partner: partnerPDA.publicKey,
    authority,
    partner_fee_claim_authority,
    fee_rate,
    start_time,
    end_time,
    name,
  };
};

export async function generateDefaultOpenPositionParams(
  context: ClmmpoolContext,
  clmmpool: PublicKey,
  tickLowerIndex: number,
  tickUpperIndex: number,
  owner?: PublicKey
): Promise<{ params: Required<OpenPositionParams>; nftMint: Keypair }> {
  const positionNFTMintKeypair = Keypair.generate();
  const positionEdition = Keypair.generate();
  const positionPda = PDAUtil.getPositionPDA(
    context.program.programId,
    positionNFTMintKeypair.publicKey
  );

  const metadataPda = PDAUtil.getPositionMetadataPDA(
    positionNFTMintKeypair.publicKey
  );

  const positionTokenAccountAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    positionNFTMintKeypair.publicKey,
    owner || context.wallet.publicKey
  );

  const params: Required<OpenPositionParams> = {
    tickLowerIndex,
    tickUpperIndex,
    owner: owner || context.wallet.publicKey,
    clmmpool,
    position: positionPda.publicKey,
    positionNftMint: positionNFTMintKeypair.publicKey,
    positionMetadataAccount: metadataPda.publicKey,
    positionEdition: positionEdition.publicKey,
    positionNftUpdateAuthority: POSITION_NFT_UPDATE_AUTHORITY,
    positionAta: positionTokenAccountAddress,
  };

  return {
    params,
    nftMint: positionNFTMintKeypair,
  };
}
