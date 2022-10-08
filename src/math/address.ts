import type { Address } from "@project-serum/anchor";
import { translateAddress } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import type { PublicKey } from "@solana/web3.js";

export declare type PDA = {
  publicKey: PublicKey;
  bump: number;
};

export class AddressUtil {
  static toPubKey(address: Address): PublicKey {
    return translateAddress(address);
  }

  static toPubKeys(addresses: Address[]): PublicKey[] {
    return addresses.map((address) => AddressUtil.toPubKey(address));
  }

  static findProgramAddress(
    seeds: (Uint8Array | Buffer)[],
    programId: PublicKey
  ): PDA {
    const [publicKey, bump] = findProgramAddressSync(seeds, programId);
    return { publicKey, bump };
  }
}
