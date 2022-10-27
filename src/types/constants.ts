import { BN } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
/**
 * CLMM's config PublicKey.
 * @category Constants
 */
export const CLMMPOOLS_CONFIG = new PublicKey(
  "2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ"
);

export const CLMMPOOL_PROGRAM_ID = new PublicKey(
  "CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR"
);

export const MINT_WRAPPER_PROGRAM_ID = new PublicKey(
  "CMWr5a5feRxAeowwHcm1u5bYwmUvsAjcBbqLRcBshyAR"
);

/**
 * The maximum tick index supported by the clmmpool program.
 * @category Constants
 */
export const MAX_TICK_INDEX = 443636;

/**
 * The minimum tick index supported by the clmmpool program.
 * @category Constants
 */
export const MIN_TICK_INDEX = -443636;

/**
 * The maximum sqrt-price supported by the clmmpool program.
 * @category Constants
 */
export const MAX_SQRT_PRICE = "79226673515401279992447579055";

/**
 * The minimum sqrt-price supported by the clmmpool program.
 * @category Constants
 */
export const MIN_SQRT_PRICE = "4295048016";

/**
 * The number of initialized ticks that a tick-array account can hold.
 * @category Constants
 */
export const TICK_ARRAY_SIZE = 64;

/**
 * @category Constants
 */
export const METADATA_PROGRAM_ADDRESS = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

/**
 * The denominator which the protocol fee rate is divided on.
 * @category Constants
 */
export const PROTOCOL_FEE_RATE_DENOMINATOR = new BN(10_000);

/**
 * The denominator which the fee rate is divided on.
 * @category Constants
 */
export const FEE_RATE_DENOMINATOR = new BN(1_000_000);

/**
 * The max and min number of tick arrays that tick array map holds.
 * @category Constants
 */
export const TICK_ARRAY_MAP_MAX_BIT_INDEX = 868 * 8 - 1;
export const TICK_ARRAY_MAP_MIN_BIT_INDEX = 0;

export const MAX_TICK_ARRAY = 3;
export const TICK_ARRAY_AMOUNT = 6943;

export const POSITION_NFT_UPDATE_AUTHORITY = new PublicKey(
  "5QW9BCx6oZKjSWCVyBZaVU8N4jwtFnged9TsiaXvDj8Q"
);

export const ZERO_BN = new anchor.BN(0);
