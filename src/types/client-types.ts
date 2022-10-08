import type { AccountInfo, MintInfo } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";

import type { TickArrayData } from "./clmmpool";

/**
 * Extended MintInfo class to host token info.
 * @category ClmmpoolClient
 */
export type TokenInfo = MintInfo & { mint: PublicKey };

export type TokenAccountInfo = AccountInfo;

/**
 * A wrapper class of a TickArray on a Clmmpool
 * @category ClmmpoolClient
 */
export type TickArray = {
  address: PublicKey;
  data: TickArrayData | null;
};
