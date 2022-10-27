import type { Address } from "@project-serum/anchor";
import { translateAddress } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import type { PublicKey } from "@solana/web3.js";

export declare type PDA = {
  publicKey: PublicKey;
  bump: number;
};
/**
 * AddressUtil - the utils set for address struct.
 */
export class AddressUtil {
  /**
   * Transforms an address to a PublicKey.
   * 
   * @param address 
   * @returns 
   */
  static toPubKey(address: Address): PublicKey {
    return translateAddress(address);
  }

  /**
   * Transform many address to a PublicKey.
   * 
   * @param addresses 
   * @returns 
   */
  static toPubKeys(addresses: Address[]): PublicKey[] {
    return addresses.map((address) => AddressUtil.toPubKey(address));
  }

  /**
   * Get the PDA for a given program address.
   * 
   * @param seeds 
   * @param programId 
   * @returns 
   */
  static findProgramAddress(
    seeds: (Uint8Array | Buffer)[],
    programId: PublicKey
  ): PDA {
    const [publicKey, bump] = findProgramAddressSync(seeds, programId);
    return { publicKey, bump };
  }
}
