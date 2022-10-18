import BN from "bn.js";

import type { ClmmpoolContext } from "../../src";
import type { ClmmpoolData } from "../../src/types/clmmpool";
import { getTokenBalance } from "./token";

export type VaultAmounts = {
  tokenA: BN;
  tokenB: BN;
};

export async function getVaultAmounts(
  ctx: ClmmpoolContext,
  clmmpoolData: ClmmpoolData
) {
  return {
    tokenA: new BN(
      await getTokenBalance(ctx.provider, clmmpoolData.tokenAVault)
    ),
    tokenB: new BN(
      await getTokenBalance(ctx.provider, clmmpoolData.tokenBVault)
    ),
  };
}
