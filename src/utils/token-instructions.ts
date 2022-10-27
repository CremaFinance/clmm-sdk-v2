import type { u64 } from "@solana/spl-token";
import {
  AccountLayout,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type {
  PublicKey,
  Signer,
  TransactionInstruction,
} from "@solana/web3.js";
import { Keypair, SystemProgram } from "@solana/web3.js";

export type ResolvedTokenAddressInstruction = {
  address: PublicKey;
} & Instruction;

/**
 * @category ResolvedTokenAddressInstruction
 *
 * @param wallet    wallet address
 * @param amountIn  token amountIn
 * @param rentExemptLamports  rentExemptLamports
 *
 * @return
 */
export function createWSOLAccountInstructions(
  wallet: PublicKey,
  amountIn: u64,
  rentExemptLamports: number
): ResolvedTokenAddressInstruction {
  const tempAccount = new Keypair();

  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: wallet,
    newAccountPubkey: tempAccount.publicKey,
    lamports: amountIn.toNumber() + rentExemptLamports,
    space: AccountLayout.span,
    programId: TOKEN_PROGRAM_ID,
  });

  const initAccountInstruction = Token.createInitAccountInstruction(
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
    tempAccount.publicKey,
    wallet
  );

  const closeWSOLAccountInstruction = Token.createCloseAccountInstruction(
    TOKEN_PROGRAM_ID,
    tempAccount.publicKey,
    wallet,
    wallet,
    []
  );

  return {
    address: tempAccount.publicKey,
    instructions: [createAccountInstruction, initAccountInstruction],
    cleanupInstructions: [closeWSOLAccountInstruction],
    signers: [tempAccount],
  };
}

/**
 * @category EMPTY_INSTRUCTION
 */
export const EMPTY_INSTRUCTION: Instruction = {
  instructions: [],
  cleanupInstructions: [],
  signers: [],
};

/**
 * @category Instruction
 */
export type Instruction = {
  instructions: TransactionInstruction[];
  cleanupInstructions: TransactionInstruction[];
  signers: Signer[];
};
