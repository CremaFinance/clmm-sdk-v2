import type { Address } from "@project-serum/anchor";
import { translateAddress, utils } from "@project-serum/anchor";
import type { PublicKey } from "@solana/web3.js";

/**
 * @category PDA Util
 */
export type PDA = { publicKey: PublicKey; bump: number };

/**
 * @category Address Util
 */
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
    const [publicKey, bump] = utils.publicKey.findProgramAddressSync(
      seeds,
      programId
    );
    return { publicKey, bump };
  }
}
