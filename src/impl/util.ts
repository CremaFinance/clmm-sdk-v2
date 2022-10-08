import type { AccountFetcher } from "..";
import type {
  ClmmpoolData,
  //   WhirlpoolRewardInfo,
  //   WhirlpoolRewardInfoData,
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

// export async function getRewardInfos(
//   fetcher: AccountFetcher,
//   data: WhirlpoolData,
//   refresh: boolean
// ): Promise<WhirlpoolRewardInfo[]> {
//   const rewardInfos: WhirlpoolRewardInfo[] = [];
//   for (const rewardInfo of data.rewardInfos) {
//     rewardInfos.push(await getRewardInfo(fetcher, rewardInfo, refresh));
//   }
//   return rewardInfos;
// }

// async function getRewardInfo(
//   fetcher: AccountFetcher,
//   data: WhirlpoolRewardInfoData,
//   refresh: boolean
// ): Promise<WhirlpoolRewardInfo> {
//   const rewardInfo = { ...data, initialized: false, vaultAmount: new BN(0) };
//   if (PoolUtil.isRewardInitialized(data)) {
//     const vaultInfo = await fetcher.getTokenInfo(data.vault, refresh);
//     if (!vaultInfo) {
//       throw new Error(`Unable to fetch TokenAccountInfo for vault - ${data.vault}`);
//     }
//     rewardInfo.initialized = true;
//     rewardInfo.vaultAmount = vaultInfo.amount;
//   }
//   return rewardInfo;
// }

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
