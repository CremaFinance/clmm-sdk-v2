import type { Provider } from "@cremafinance/solana-contrib";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import { getATAAddress, getOrCreateATA } from "@cremafinance/token-utils";
import type { AccountInfo } from "@solana/spl-token";
import { AccountLayout, NATIVE_MINT, Token, u64 } from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import type Decimal from "decimal.js";
import invariant from "tiny-invariant";

import { createSyncNativeInstruction } from "./token";
/**
 * @category TokenUtil
 */
export class TokenUtil {
  static deserializeTokenAccount = (
    data: Buffer | undefined
  ): AccountInfo | null => {
    if (!data) {
      return null;
    }

    const accountInfo = AccountLayout.decode(data);
    accountInfo.mint = new PublicKey(accountInfo.mint);
    accountInfo.owner = new PublicKey(accountInfo.owner);
    accountInfo.amount = u64.fromBuffer(accountInfo.amount);

    if (accountInfo.delegateOption === 0) {
      accountInfo.delegate = null;
      accountInfo.delegatedAmount = new u64(0);
    } else {
      accountInfo.delegate = new PublicKey(accountInfo.delegate);
      accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
    }

    accountInfo.isInitialized = accountInfo.state !== 0;
    accountInfo.isFrozen = accountInfo.state === 2;

    if (accountInfo.isNativeOption === 1) {
      accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
      accountInfo.isNative = true;
    } else {
      accountInfo.rentExemptReserve = null;
      accountInfo.isNative = false;
    }

    if (accountInfo.closeAuthorityOption === 0) {
      accountInfo.closeAuthority = null;
    } else {
      accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
    }

    return accountInfo;
  };

  static async wrapSOL(
    provider: Provider,
    amount: Decimal
  ): Promise<TransactionEnvelope> {
    invariant(amount.greaterThan(0));
    const tx = new TransactionEnvelope(provider, []);
    const { address: ataAddress, instruction: ataInstruction } =
      await getOrCreateATA({
        provider: provider,
        mint: NATIVE_MINT,
        owner: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
      });
    if (ataInstruction !== null) {
      tx.instructions.push(ataInstruction);
    }
    tx.instructions.push(
      SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: ataAddress,
        lamports: amount.toNumber(),
      })
    );
    tx.instructions.push(createSyncNativeInstruction(ataAddress));
    return tx;
  }

  static async unwrapSOL(
    provider: Provider,
    ataAddress: PublicKey,
    dest?: PublicKey
  ): Promise<TransactionEnvelope> {
    const checkAta = await getATAAddress({
      mint: NATIVE_MINT,
      owner: provider.wallet.publicKey,
    });
    invariant(ataAddress.equals(checkAta), "Only allow close wrap SOL ata");
    const tx = Token.createCloseAccountInstruction(
      ataAddress,
      dest || provider.wallet.publicKey,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      []
    );
    return new TransactionEnvelope(provider, [tx]);
  }
}
