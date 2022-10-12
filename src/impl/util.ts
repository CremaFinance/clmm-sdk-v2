import type { AccountFetcher } from "..";
import type {
  ClmmpoolData,
  TokenAccountInfo,
  TokenInfo,
} from "../types";

export async function getTokenMintInfos(
  fetcher: AccountFetcher,
  data: ClmmpoolData,
  refresh: boolean
): Promise<TokenInfo[]> {
  const mintA = data.tokenA;
  const infoA = await fetcher.getMintInfo(mintA, refresh);
  if (!infoA) {
    throw new Error(`Unable to fetch MintInfo for mint - ${mintA}`);
  }
  const mintB = data.tokenB;
  const infoB = await fetcher.getMintInfo(mintB, refresh);
  if (!infoB) {
    throw new Error(`Unable to fetch MintInfo for mint - ${mintB}`);
  }
  return [
    { mint: mintA, ...infoA },
    { mint: mintB, ...infoB },
  ];
}

export async function getTokenVaultAccountInfos(
  fetcher: AccountFetcher,
  data: ClmmpoolData,
  refresh: boolean
): Promise<TokenAccountInfo[]> {
  const vaultA = data.tokenAVault;
  const vaultInfoA = await fetcher.getTokenInfo(vaultA, refresh);
  if (!vaultInfoA) {
    throw new Error(`Unable to fetch TokenAccountInfo for vault - ${vaultA}`);
  }
  const vaultB = data.tokenBVault;
  const vaultInfoB = await fetcher.getTokenInfo(vaultB, refresh);
  if (!vaultInfoB) {
    throw new Error(`Unable to fetch TokenAccountInfo for vault - ${vaultB}`);
  }
  return [vaultInfoA, vaultInfoB];
}
