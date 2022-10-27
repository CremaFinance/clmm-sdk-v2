import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";

import type { ResolvedTokenAddressInstruction } from "./token-instructions";
import {
  createWSOLAccountInstructions,
  EMPTY_INSTRUCTION,
} from "./token-instructions";
import { TokenUtil } from "./token-utils";

/**
 * Resolve or create ata.
 * 
 * @param connection Solana connection class
 * @param ownerAddress The user's public key
 * @param tokenMint Token mint address
 * @param wrappedSolAmountIn Optional. Only use for input/source token that could be SOL
 * @param payer Payer that would pay the rent for the creation of the ATAs
 * @returns
 */
export async function resolveOrCreateATA(
  connection: Connection,
  ownerAddress: PublicKey,
  tokenMint: PublicKey,
  getAccountRentExempt: () => Promise<number>,
  wrappedSolAmountIn = new u64(0),
  payer = ownerAddress
): Promise<ResolvedTokenAddressInstruction> {
  const instructions = await resolveOrCreateATAs(
    connection,
    ownerAddress,
    [{ tokenMint, wrappedSolAmountIn }],
    getAccountRentExempt,
    payer
  );
  return instructions[0]!;
}

type ResolvedTokenAddressRequest = {
  tokenMint: PublicKey;
  wrappedSolAmountIn?: u64;
};

/**
 * Resolve or create atas.
 *
 * @param connection Solana connection class
 * @param ownerAddress The user's public key
 * @param requests The resolved token address requests
 * @param payer Payer that would pay the rent for the creation of the ATAs
 * @returns
 */
export async function resolveOrCreateATAs(
  connection: Connection,
  ownerAddress: PublicKey,
  requests: ResolvedTokenAddressRequest[],
  getAccountRentExempt: () => Promise<number>,
  payer = ownerAddress
): Promise<ResolvedTokenAddressInstruction[]> {
  const nonNativeMints = requests.filter(
    ({ tokenMint }) => !tokenMint.equals(NATIVE_MINT)
  );
  const nativeMints = requests.filter(({ tokenMint }) =>
    tokenMint.equals(NATIVE_MINT)
  );

  if (nativeMints.length > 1) {
    throw new Error("Cannot resolve multiple WSolAccounts");
  }

  const instructionMap: {
    [tokenMint: string]: ResolvedTokenAddressInstruction;
  } = {};
  if (nonNativeMints.length > 0) {
    const nonNativeAddresses = await Promise.all(
      nonNativeMints.map(({ tokenMint }) => deriveATA(ownerAddress, tokenMint))
    );
    const tokenAccountInfos = await connection.getMultipleAccountsInfo(
      nonNativeAddresses
    );
    const tokenAccounts = tokenAccountInfos.map((tai) =>
      TokenUtil.deserializeTokenAccount(tai?.data as Buffer)
    );
    tokenAccounts.forEach((tokenAccount, index) => {
      const ataAddress = nonNativeAddresses[index]!;
      let resolvedInstruction;
      if (tokenAccount) {
        resolvedInstruction = { address: ataAddress, ...EMPTY_INSTRUCTION };
      } else {
        const createAtaInstruction =
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            nonNativeMints[index]!.tokenMint,
            ataAddress,
            ownerAddress,
            payer
          );

        resolvedInstruction = {
          address: ataAddress,
          instructions: [createAtaInstruction],
          cleanupInstructions: [],
          signers: [],
        };
      }
      instructionMap[nonNativeMints[index]!.tokenMint.toBase58()] =
        resolvedInstruction;
    });
  }

  if (nativeMints.length > 0) {
    const accountRentExempt = await getAccountRentExempt();
    const wrappedSolAmountIn = nativeMints[0]?.wrappedSolAmountIn || new u64(0);
    instructionMap[NATIVE_MINT.toBase58()] = createWSOLAccountInstructions(
      ownerAddress,
      wrappedSolAmountIn,
      accountRentExempt
    );
  }

  // Preserve order of resolution
  return requests.map(({ tokenMint }) => instructionMap[tokenMint.toBase58()]!);
}

/**
 * Derive  ata address.
 *
 * @param ownerAddress Ata owner address
 * @param tokenMint Token mint address
 * @returns
 */
export async function deriveATA(
  ownerAddress: PublicKey,
  tokenMint: PublicKey
): Promise<PublicKey> {
  return await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    tokenMint,
    ownerAddress
  );
}
