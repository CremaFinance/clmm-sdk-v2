import BN from "bn.js";
import type { PublicKey } from "@solana/web3.js";

import { TickMath } from "../math/tick";
import { METADATA_PROGRAM_ADDRESS } from "../types";
import { AddressUtil, PDA } from "../utils/address-util";
import { TickUtil } from "./tick";

const CLMM_CONFIG_SEED = "clmmconfig";
const PDA_CLMMPOOL_SEED = "clmmpool";
const PDA_POSITION_SEED = "position";
const PDA_TICK_ARRAY_SEED = "tick_array";
const PDA_TICK_ARRAY_MAP_SEED = "tick_array_map";
const PDA_FEE_TIER_SEED = "fee_tier";
const PDA_PARTNER_SEED = "partner";
const PDA_METADATA_SEED = "metadata";
const PDA_CLMMPOOL_METADATA_SEED = "clmmpool_metadata";
const PDA_EDITION_SEED = "edition";

/**
 * @category PDA Utils
 */
export class PDAUtil {
  /**
   * Get clmm config pda.
   * 
   * @param programId 
   * @returns 
   */
  static getClmmConfigPDA(programId: PublicKey): PDA {
    return AddressUtil.findProgramAddress(
      [Buffer.from(CLMM_CONFIG_SEED)],
      programId
    );
  }

  /**
   * Get clmmpool pda.
   * @param programId
   * @param clmmConfigKey
   * @param tokenMintAKey
   * @param tokenMintBKey
   * @param tickSpacing
   * @returns
   */
  static getClmmpoolPDA(
    programId: PublicKey,
    clmmConfigKey: PublicKey,
    tokenMintAKey: PublicKey,
    tokenMintBKey: PublicKey,
    tickSpacing: number
  ): PDA {
    const [mintA, mintB] = tokenMintAKey.toBuffer() < tokenMintBKey.toBuffer() ? [tokenMintAKey, tokenMintBKey] : [tokenMintBKey, tokenMintAKey];

    return AddressUtil.findProgramAddress(
      [
        Buffer.from(PDA_CLMMPOOL_SEED),
        clmmConfigKey.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        new BN(tickSpacing).toArrayLike(Buffer, "le", 2),
      ],
      programId
    );
  }

  /**
   * Get position pda.
   * 
   * @param programId
   * @param positionNFTMintKey
   * @returns
   */
  static getPositionPDA(programId: PublicKey, positionNFTMintKey: PublicKey): PDA {
    return AddressUtil.findProgramAddress(
      [Buffer.from(PDA_POSITION_SEED), positionNFTMintKey.toBuffer()],
      programId
    );
  }

  /**
   * Get position mint key.
   * 
   * @param positionMintKey
   * @returns
   */
  static getPositionMetadataPDA(positionMintKey: PublicKey): PDA {
    return AddressUtil.findProgramAddress(
      [
        Buffer.from(PDA_METADATA_SEED),
        METADATA_PROGRAM_ADDRESS.toBuffer(),
        positionMintKey.toBuffer(),
      ],
      METADATA_PROGRAM_ADDRESS
    );
  }

  /**
   * Get opsition edition pda.
   * 
   * @param positionMintKey 
   * @returns 
   */
  static getPositionEditionPDA(positionMintKey: PublicKey): PDA {
    return AddressUtil.findProgramAddress(
      [
        Buffer.from(PDA_METADATA_SEED),
        METADATA_PROGRAM_ADDRESS.toBuffer(),
        positionMintKey.toBuffer(),
        Buffer.from(PDA_EDITION_SEED),
      ],
      METADATA_PROGRAM_ADDRESS
    );
  }

  /**
   * Get tick array pda.
   * 
   * @param programId
   * @param clmmpoolKey
   * @param arrayIndex
   * @returns
   */
  static getTickArrayPDA(
    programId: PublicKey,
    clmmpoolKey: PublicKey,
    arrayIndex: number
  ): PDA {
    return AddressUtil.findProgramAddress(
      [
        Buffer.from(PDA_TICK_ARRAY_SEED),
        clmmpoolKey.toBuffer(),
        new BN(arrayIndex).toArrayLike(Buffer, "le", 2),
      ],
      programId
    );
  }

  /**
   * Get tick array map pda.
   * 
   * @param programId
   * @param clmmpoolKey
   * @returns
   */
  static getTickArrayMapPDA(programId: PublicKey, clmmpoolKey: PublicKey): PDA {
    return AddressUtil.findProgramAddress(
      [Buffer.from(PDA_TICK_ARRAY_MAP_SEED), clmmpoolKey.toBuffer()],
      programId
    );
  }

  /**
   * Get tick array from tick index PDA.
   *
   * @param tickIndex
   * @param tickSpacing
   * @param clmmpool
   * @param programId
   * @returns
   */
  static getTickArrayFromTickIndexPDA(
    tickIndex: number,
    tickSpacing: number,
    clmmpool: PublicKey,
    programId: PublicKey
  ): PDA {
    const arrayIndex = TickUtil.getArrayIndex(tickIndex, tickSpacing);
    return PDAUtil.getTickArrayPDA(
      AddressUtil.toPubKey(programId),
      AddressUtil.toPubKey(clmmpool),
      arrayIndex
    );
  }

  /**
   * Get the PDA of the tick array containing tickIndex.
   * tickArrayOffset can be used to get neighboring tick arrays.
   *
   * @param sqrtPriceX64
   * @param tickSpacing
   * @param clmmpool
   * @param programId
   * @returns
   */
  static getTickArrayFromSqrtPricePDA(
    sqrtPriceX64: BN,
    tickSpacing: number,
    clmmpool: PublicKey,
    programId: PublicKey
  ): PDA {
    const tickIndex = TickMath.sqrtPriceX64ToTickIndex(sqrtPriceX64);
    return PDAUtil.getTickArrayFromTickIndexPDA(
      tickIndex,
      tickSpacing,
      clmmpool,
      programId
    );
  }

  /**
   * @category Program Derived Addresses
   * @param programId
   * @param clmmConfigKey
   * @param tickSpacing
   * @returns
   */
  static getFeeTierPDA(
    programId: PublicKey,
    clmmConfigKey: PublicKey,
    tickSpacing: number
  ): PDA {
    return AddressUtil.findProgramAddress(
      [
        Buffer.from(PDA_FEE_TIER_SEED),
        clmmConfigKey.toBuffer(),
        new BN(tickSpacing).toArrayLike(Buffer, "le", 2),
      ],
      programId
    );
  }

  /**
   * @category Get Program Derived Addresses
   * @param programId
   * @param baseKey
   * @returns
   */
  static getPartnerPDA(programId: PublicKey, baseKey: PublicKey): PDA {
    return AddressUtil.findProgramAddress(
      [Buffer.from(PDA_PARTNER_SEED), baseKey.toBuffer()],
      programId
    );
  }

  /**
   * @category Get Program Derived Addresses
   * @param programId
   * @param clmmpoolKey
   * @returns
   */
  static getClmmpoolMetadataPDA(programId: PublicKey, clmmpoolKey: PublicKey): PDA {
    return AddressUtil.findProgramAddress(
      [
        Buffer.from(PDA_CLMMPOOL_METADATA_SEED),
        clmmpoolKey.toBuffer()
      ],
      programId
    );
  }
}
