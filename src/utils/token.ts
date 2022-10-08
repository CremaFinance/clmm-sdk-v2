import type { web3 } from "@project-serum/anchor";
import type { Provider } from "@saberhq/solana-contrib";
import { struct, u8 } from "@solana/buffer-layout";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { TransactionInstruction as TransactionInstructionClass } from "@solana/web3.js";
// createSyncNativeInstruction implement （refer to spl-token2.0）

/** Instructions defined by the program */
export declare enum TokenInstruction {
  InitializeMint = 0,
  InitializeAccount = 1,
  InitializeMultisig = 2,
  Transfer = 3,
  Approve = 4,
  Revoke = 5,
  SetAuthority = 6,
  MintTo = 7,
  Burn = 8,
  CloseAccount = 9,
  FreezeAccount = 10,
  ThawAccount = 11,
  TransferChecked = 12,
  ApproveChecked = 13,
  MintToChecked = 14,
  BurnChecked = 15,
  InitializeAccount2 = 16,
  SyncNative = 17,
  InitializeAccount3 = 18,
  InitializeMultisig2 = 19,
  InitializeMint2 = 20,
}

export interface SyncNativeInstructionData {
  instruction: TokenInstruction.SyncNative;
}

export const syncNativeInstructionData = struct<SyncNativeInstructionData>([
  u8("instruction"),
]);

/**
 * Construct a SyncNative instruction
 *
 * @param account   Native account to sync lamports from
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createSyncNativeInstruction(
  account: PublicKey,
  programId = TOKEN_PROGRAM_ID
): TransactionInstruction {
  const keys = [{ pubkey: account, isSigner: false, isWritable: true }];

  const data = Buffer.alloc(syncNativeInstructionData.span);
  syncNativeInstructionData.encode({ instruction: 17 }, data);

  return new TransactionInstructionClass({ keys, programId, data });
}

/**
 * Return balance of a native account
 *
 * @param provider  Solana provider
 * @param vault     Token account to get balance of
 *
 * @return Instruction to add to a transaction
 */
export async function getTokenBalance(
  provider: Provider,
  vault: web3.PublicKey
) {
  return (await provider.connection.getTokenAccountBalance(vault, "confirmed"))
    .value.amount;
}
