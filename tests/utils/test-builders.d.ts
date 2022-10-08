import type { PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import type BN from "bn.js";
import type { CreateClmmConfigParams, CreateClmmpoolParams, CreateFeeTierParams, CreatePartnerParams, CreateTickArrayMapParams, CreateTickArrayParams, OpenPositionParams } from "../../src";
import type { ClmmpoolContext } from "../../src/context";
export interface TestClmmpoolsConfigKeypairs {
    protocolAuthorityKeypair: Keypair;
    protocolClaimAuthorityKeypair: Keypair;
    createPoolAuthorityKeypair: Keypair;
}
export interface TestTokenVaultsKeypairs {
    tokenAVaultKeypair: Keypair;
    tokenBVaultKeypair: Keypair;
}
export declare const generateDefaultConfigParams: (context: ClmmpoolContext, payer?: PublicKey) => {
    configInitInfo: CreateClmmConfigParams;
    configKeypairs: TestClmmpoolsConfigKeypairs;
};
export declare const createInOrderMints: (context: ClmmpoolContext) => Promise<[PublicKey, PublicKey]>;
export declare const generateDefaultCreatePoolParams: (context: ClmmpoolContext, configPubkey: PublicKey, feeTierPubkey: PublicKey, tickSpacing: number, initSqrtPrice?: BN, payer?: PublicKey) => Promise<{
    poolCreateInfo: CreateClmmpoolParams;
}>;
export declare const generateDefaultInitFeeTierParams: (context: ClmmpoolContext, clmmConfig: PublicKey, feeAuthority: PublicKey, tickSpacing: number, feeRate: number, feeTier: PublicKey, payer?: PublicKey) => CreateFeeTierParams;
export declare const generateDefaultInitTickArrayParams: (context: ClmmpoolContext, clmmpool: PublicKey, arrayIndex: number, payer?: PublicKey) => CreateTickArrayParams;
export declare const generateDefaultInitTickArrayMapParams: (context: ClmmpoolContext, clmmpool: PublicKey, payer?: PublicKey) => CreateTickArrayMapParams;
export declare const generateDefaultCreatePartnerParams: (context: ClmmpoolContext, base: PublicKey, clmmConfig: PublicKey, protocolAuthority: PublicKey, authority: PublicKey, partner_fee_claim_authority: PublicKey, fee_rate: number, start_time: BN, end_time: BN, name: string, payer?: PublicKey) => CreatePartnerParams;
export declare function generateDefaultOpenPositionParams(context: ClmmpoolContext, clmmpool: PublicKey, tickLowerIndex: number, tickUpperIndex: number, owner?: PublicKey): Promise<{
    params: Required<OpenPositionParams>;
    nftMint: Keypair;
}>;
