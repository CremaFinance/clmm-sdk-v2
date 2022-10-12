import type { AnchorTypes } from "@cremafinance/anchor-contrib";
import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";

import type { Clmmpool } from "../idls/clmmpool";

// export * from "../idls/clmmpool";

export type ClmmpoolTypes = AnchorTypes<Clmmpool>;

type Accounts = ClmmpoolTypes["Accounts"];

export enum AccountName {
  ClmmConfig = "ClmmConfig",
  ClmmPool = "Clmmpool",
  FeeTier = "FeeTier",
  Partner = "Partner",
  Position = "Position",
  TickArrayMap = "TickArrayMap",
  TickArray = "TickArray",
  Rewarder = "Rewarder",
}

export type RewarderData = {
  mintWrapper: PublicKey;
  minter: PublicKey;
  mint: PublicKey;
  authority: PublicKey;
  emissionsPerSecond: BN;
  growthGlobal: BN;
};

export type TickData = {
  isInitialized: boolean;
  index: number;
  sqrtPrice: BN;
  liquidityNet: BN;
  liquidityGross: BN;
  feeGrowthOutsideA: BN;
  feeGrowthOutsideB: BN;
  rewardGrowthOutside: BN[];
};

// PDA
export type ClmmpoolData = Accounts["clmmpool"];
// export type ClmmConfig = Accounts["ClmmConfig"];
export type ClmmConfigData = Accounts["clmmConfig"];
export type PositionData = Accounts["position"];
export type FeeTierData = Accounts["feeTier"];
// export type Partner = Accounts["Partner"];
export type PartnerData = Accounts["partner"];
// export type TickArrayData = Accounts["TickArray"];
export type TickArrayMapData = Accounts["tickArrayMap"];

export type TickArrayData = {
  arrayIndex: number;
  tickSpacing: number;
  clmmpool: PublicKey;
  ticks: TickData[];
};

// Program
export type ClmmpoolProgram = ClmmpoolTypes["Program"];

// Event
export type ClmmpoolEvent = ClmmpoolTypes["Events"];
