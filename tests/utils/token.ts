import type { BN } from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import type { Provider, TransactionReceipt } from "@cremafinance/solana-contrib";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import type { AuthorityType } from "@solana/spl-token";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";

import { deriveATA } from "../../src/utils/ata-utils";
import { TEST_TOKEN_PROGRAM_ID } from "./test-consts";
import { confirmTx } from "./utils";

export async function createMint(
  provider: Provider,
  authority?: web3.PublicKey
): Promise<web3.PublicKey> {
  if (authority === undefined) {
    authority = provider.wallet.publicKey;
  }
  const mint = web3.Keypair.generate();
  const instructions = await createMintInstructions(
    provider,
    authority,
    mint.publicKey
  );

  const tx = new web3.Transaction();
  tx.add(...instructions);

  await provider.send(tx, [mint], { commitment: "confirmed" });

  return mint.publicKey;
}

export async function createMintInstructions(
  provider: Provider,
  authority: web3.PublicKey,
  mint: web3.PublicKey
) {
  const instructions = [
    web3.SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mint,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TEST_TOKEN_PROGRAM_ID,
    }),
    Token.createInitMintInstruction(
      TEST_TOKEN_PROGRAM_ID,
      mint,
      0,
      authority,
      null
    ),
  ];
  return instructions;
}

export async function createTokenAccount(
  provider: Provider,
  mint: web3.PublicKey,
  owner?: web3.PublicKey
) {
  const tokenAccount = web3.Keypair.generate();
  const ixs = await createTokenAccountInstrs(
    provider,
    tokenAccount.publicKey,
    mint,
    owner || provider.wallet.publicKey
  );
  const tx = new TransactionEnvelope(provider, ixs);
  // newAccountPubkey isSigner.
  tx.addSigners(tokenAccount);

  await confirmTx(tx);

  return tokenAccount.publicKey;
}

async function createTokenAccountInstrs(
  provider: Provider,
  newAccountPubkey: web3.PublicKey,
  mint: web3.PublicKey,
  owner: web3.PublicKey,
  lamports?: number
) {
  if (lamports === undefined) {
    lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
  }
  return [
    web3.SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey,
      lamports,
      space: 165,
      programId: TEST_TOKEN_PROGRAM_ID,
    }),
    Token.createInitAccountInstruction(
      TEST_TOKEN_PROGRAM_ID,
      mint,
      newAccountPubkey,
      owner
    ),
  ];
}

export async function createAssociatedTokenAccount(
  provider: Provider,
  mint: web3.PublicKey,
  owner: web3.PublicKey,
  payer?: web3.PublicKey
) {
  const ataAddress = await deriveATA(owner, mint);

  const tx = new TransactionEnvelope(provider, [
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      ataAddress,
      owner,
      payer || provider.wallet.publicKey
    ),
  ]);

  await confirmTx(tx);
  return ataAddress;
}

/**
 * Mints tokens to the specified destination token account.
 * @param provider An anchor AnchorProvider object used to send transactions
 * @param mint Mint address of the token
 * @param destination Destination token account to receive tokens
 * @param amount Number of tokens to mint
 */
export async function mintToByAuthority(
  provider: Provider,
  mint: web3.PublicKey,
  destination: web3.PublicKey,
  amount: number | BN
): Promise<TransactionReceipt> {
  const tx = new TransactionEnvelope(provider, [
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      destination,
      provider.wallet.publicKey,
      [],
      amount
    ),
  ]);

  const receipt = await confirmTx(tx);
  return receipt;
}

/**
 * Creates a token account for the mint and mints the specified amount of tokens into the token account.
 * The caller is assumed to be the mint authority.
 * @param provider An anchor AnchorProvider object used to send transactions
 * @param mint The mint address of the token
 * @param amount Number of tokens to mint to the newly created token account
 */
export async function createAndMintToTokenAccount(
  provider: Provider,
  mint: web3.PublicKey,
  amount: number | BN
): Promise<web3.PublicKey> {
  const tokenAccount = await createTokenAccount(
    provider,
    mint,
    provider.wallet.publicKey
  );
  await mintToByAuthority(
    provider,
    mint,
    tokenAccount,
    new u64(amount.toString())
  );
  return tokenAccount;
}

export async function createAndMintToAssociatedTokenAccount(
  provider: Provider,
  mint: web3.PublicKey,
  amount: number | BN,
  destinationWallet?: web3.PublicKey,
  payer?: web3.PublicKey
): Promise<web3.PublicKey> {
  const destinationWalletKey = destinationWallet
    ? destinationWallet
    : provider.wallet.publicKey;
  const payerKey = payer ? payer : provider.wallet.publicKey;
  const tokenAccount = await createAssociatedTokenAccount(
    provider,
    mint,
    destinationWalletKey,
    payerKey
  );
  await mintToByAuthority(
    provider,
    mint,
    tokenAccount,
    new u64(amount.toString())
  );
  return tokenAccount;
}

export async function getTokenBalance(
  provider: Provider,
  vault: web3.PublicKey
) {
  return (await provider.connection.getTokenAccountBalance(vault, "confirmed"))
    .value.amount;
}

export async function approveToken(
  provider: Provider,
  tokenAccount: web3.PublicKey,
  delegate: web3.PublicKey,
  amount: number | u64,
  owner?: web3.Keypair
) {
  const tx = new TransactionEnvelope(provider, [
    Token.createApproveInstruction(
      TOKEN_PROGRAM_ID,
      tokenAccount,
      delegate,
      owner?.publicKey || provider.wallet.publicKey,
      [],
      amount
    ),
  ]);

  if (owner) {
    tx.addSigners(owner);
  }

  const receipt = await confirmTx(tx);
  return receipt;
}

export async function setAuthority(
  provider: Provider,
  tokenAccount: web3.PublicKey,
  newAuthority: web3.PublicKey,
  authorityType: AuthorityType,
  authority?: web3.Keypair
) {
  const tx = new TransactionEnvelope(provider, [
    Token.createSetAuthorityInstruction(
      TOKEN_PROGRAM_ID,
      tokenAccount,
      newAuthority,
      authorityType,
      authority?.publicKey || provider.wallet.publicKey,
      []
    ),
  ]);
  if (authority) {
    tx.addSigners(authority);
  }

  const receipt = await confirmTx(tx);
  return receipt;
}

export async function transfer(
  provider: Provider,
  source: web3.PublicKey,
  destination: web3.PublicKey,
  amount: number
) {
  const tx = new TransactionEnvelope(provider, [
    Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      source,
      destination,
      provider.wallet.publicKey,
      [],
      amount
    ),
  ]);

  const receipt = await confirmTx(tx);
  return receipt;
}
