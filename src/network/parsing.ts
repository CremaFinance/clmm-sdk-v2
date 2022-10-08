import type { Idl } from "@project-serum/anchor";
import { BorshAccountsCoder } from "@project-serum/anchor";
import type { AccountInfo, MintInfo } from "@solana/spl-token";
import { MintLayout, u64 } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

import ClmmpoolIDL from "../idls/clmmpool.json";
import type {
  ClmmConfigData,
  ClmmpoolData,
  FeeTierData,
  PartnerData,
  PositionData,
  RewarderData,
  TickArrayData,
  TickArrayMapData,
} from "../types";
import { AccountName } from "../types";
import { TokenUtil } from "../utils/token-utils";

/**
 * Static abstract class definition to parse entities.
 * @category Parsables
 */
export interface ParsableEntity<T> {
  /**
   * Parse account data
   *
   * @param accountData Buffer data for the entity
   * @returns Parsed entity
   */
  parse: (accountData: Buffer | undefined | null) => T | null;
}

/**
 * @category Parsables
 */
@staticImplements<ParsableEntity<ClmmConfigData>>()
export class ParsableClmmpoolsConfig {
  private constructor() {}

  static parse(data: Buffer | undefined | null): ClmmConfigData | null {
    if (!data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.ClmmConfig, data);
    } catch (e) {
      console.error(`error while parsing WhirlpoolsConfig: ${e}`);
      return null;
    }
  }
}

@staticImplements<ParsableEntity<PartnerData>>()
export class ParsablePartner {
  private constructor() {}

  static parse(data: Buffer | undefined | null): PartnerData | null {
    if (!data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.Partner, data);
    } catch (e) {
      console.error(`error while parsing Partner: ${e}`);
      return null;
    }
  }
}

/**
 * @category Parsables
 */
@staticImplements<ParsableEntity<ClmmpoolData>>()
export class ParsableClmmpool {
  private constructor() {}

  static parse(data: Buffer | undefined | null): ClmmpoolData | null {
    if (!data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.ClmmPool, data);
    } catch (e) {
      console.error(`error while parsing Whirlpool: ${e}`);
      return null;
    }
  }
}

/**
 * @category Parsables
 */
@staticImplements<ParsableEntity<PositionData>>()
export class ParsablePosition {
  private constructor() {}

  static parse(data: Buffer | undefined | null): PositionData | null {
    if (!data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.Position, data);
    } catch (e) {
      console.error(`error while parsing Position: ${e}`);
      return null;
    }
  }
}

@staticImplements<ParsableEntity<PositionData[]>>()
export class ParsablePositions {
  private constructor() {}

  static parse(data: Buffer | undefined | null): PositionData[] | null {
    if (!data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.Position, data);
    } catch (e) {
      console.error(`error while parsing Position: ${e}`);
      return null;
    }
  }
}

/**
 * @category Parsables
 */
@staticImplements<ParsableEntity<RewarderData>>()
export class ParsableRewarder {
  private constructor() {}

  static parse(data: Buffer | undefined | null): RewarderData | null {
    if (!data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.Rewarder, data);
    } catch (e) {
      console.error(`error while parsing Rewarders: ${e}`);
      return null;
    }
  }
}

/**
 * @category Parsables
 */
@staticImplements<ParsableEntity<TickArrayData>>()
export class ParsableTickArray {
  private constructor() {}

  static parse(data: Buffer | undefined | null): TickArrayData | null {
    if (!data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.TickArray, data);
    } catch (e) {
      console.error(`error while parsing TickArray: ${e}`);
      return null;
    }
  }
}

@staticImplements<ParsableEntity<TickArrayMapData>>()
export class ParsableTickArrayMap {
  private constructor() {}

  static parse(data: Buffer | undefined | null): TickArrayMapData | null {
    if (!data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.TickArrayMap, data);
    } catch (e) {
      console.error(`error while parsing TickArrayMap: ${e}`);
      return null;
    }
  }
}

/**
 * @category Parsables
 */
@staticImplements<ParsableEntity<FeeTierData>>()
export class ParsableFeeTier {
  private constructor() {}

  static parse(data: Buffer | undefined | null): FeeTierData | null {
    if (!data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.FeeTier, data);
    } catch (e) {
      console.error(`error while parsing FeeTier: ${e}`);
      return null;
    }
  }
}

/**
 * @category Parsables
 */
@staticImplements<ParsableEntity<AccountInfo>>()
export class ParsableTokenInfo {
  private constructor() {}

  static parse(data: Buffer | undefined | null): AccountInfo | null {
    if (!data) {
      return null;
    }

    try {
      return TokenUtil.deserializeTokenAccount(data);
    } catch (e) {
      console.error(`error while parsing TokenAccount: ${e}`);
      return null;
    }
  }
}

/**
 * @category Parsables
 */
@staticImplements<ParsableEntity<MintInfo>>()
export class ParsableMintInfo {
  private constructor() {}

  static parse(data: Buffer | undefined | null): MintInfo | null {
    if (!data) {
      return null;
    }

    try {
      const buffer = MintLayout.decode(data);
      const mintInfo: MintInfo = {
        mintAuthority:
          buffer.mintAuthorityOption === 0
            ? null
            : new PublicKey(buffer.mintAuthority),
        supply: u64.fromBuffer(buffer.supply),
        decimals: buffer.decimals,
        isInitialized: buffer.isInitialized !== 0,
        freezeAuthority:
          buffer.freezeAuthority === 0
            ? null
            : new PublicKey(buffer.freezeAuthority),
      };

      return mintInfo;
    } catch (e) {
      console.error(`error while parsing MintInfo: ${e}`);
      return null;
    }
  }
}

/**
 * Class decorator to define an interface with static methods
 * Reference: https://github.com/Microsoft/TypeScript/issues/13462#issuecomment-295685298
 */
function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}

const ClmmpoolCoder = new BorshAccountsCoder(ClmmpoolIDL as Idl);

function parseAnchorAccount(accountName: AccountName, data: Buffer) {
  const discriminator = BorshAccountsCoder.accountDiscriminator(accountName);
  if (discriminator.compare(data.slice(0, 8))) {
    console.error("incorrect account name during parsing");
    return null;
  }

  try {
    return ClmmpoolCoder.decode(accountName, data);
  } catch (_e) {
    console.error("unknown account name during parsing");
    return null;
  }
}
