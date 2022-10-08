import type { BN } from "@project-serum/anchor";
import type { u64 } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";

import type {
  ClmmpoolContext,
  InitClmmConfigParams,
  CreateClmmpoolParams,
} from "../../src";
import { TickUtil } from "../../src";
import type { FundedPositionInfo, FundedPositionParams } from "./init-utils";
import {
  createTestPoolWithTokens,
  createTestTickArrayMap,
  fundPositions,
  initTickArray,
} from "./init-utils";
import { ZERO_BN } from "./test-consts";

interface CreateFixtureParams {
  tickSpacing: number;
  initSqrtPrice?: BN;
  positions?: FundedPositionParams[];
  rewards?: RewardParam[];
}

interface RewardParam {
  emissionsPerSecondX64: BN;
  vaultAmount: u64;
}

// interface InitializedRewardInfo {
//   rewardMint: PublicKey;
//   rewardVaultKeypair: Keypair;
// }

export class ClmmpoolTestFixture {
  private ctx: ClmmpoolContext;
  private poolCreateInfo: CreateClmmpoolParams = defaultPoolCreateInfo;
  private configCreateInfo: InitClmmConfigParams = defaultConfigCreateInfo;
  private configKeypairs = defaultConfigKeypairs;
  private positions: FundedPositionInfo[] = [];
  // private rewards: InitializedRewardInfo[] = [];
  private tokenA = PublicKey.default;
  private tokenB = PublicKey.default;
  private isInitialized = false;
  private tickArrayMap = PublicKey.default;

  constructor(ctx: ClmmpoolContext) {
    this.ctx = ctx;
  }

  async init(params: CreateFixtureParams): Promise<ClmmpoolTestFixture> {
    const {
      tickSpacing,
      initSqrtPrice,
      positions,
      // rewards,
    } = params;

    const {
      poolCreateInfo,
      configCreateInfo,
      configKeypairs,
      tokenAccountA,
      tokenAccountB,
    } = await createTestPoolWithTokens(this.ctx, tickSpacing, initSqrtPrice);

    this.poolCreateInfo = poolCreateInfo;
    this.configCreateInfo = configCreateInfo;
    this.configKeypairs = configKeypairs;
    this.tokenA = tokenAccountA;
    this.tokenB = tokenAccountB;

    const tickArrayMapInfo = await createTestTickArrayMap(
      this.ctx,
      poolCreateInfo.clmmpool
    );

    this.tickArrayMap = tickArrayMapInfo.tickArrayMap;

    if (positions) {
      await initTickArrays(this.ctx, poolCreateInfo, positions);
      this.positions = await fundPositions(
        this.ctx,
        poolCreateInfo,
        tokenAccountA,
        tokenAccountB,
        positions
      );
    }

    this.isInitialized = true;
    return this;
  }

  getInfos() {
    if (!this.isInitialized) {
      throw new Error("Test fixture is not initialized");
    }
    return {
      poolCreateInfo: this.poolCreateInfo,
      configCreateInfo: this.configCreateInfo,
      configKeypairs: this.configKeypairs,
      tokenAccountA: this.tokenA,
      tokenAccountB: this.tokenB,
      positions: this.positions,
      tickArrayMap: this.tickArrayMap,
      // rewards: this.rewards,
    };
  }
}

async function initTickArrays(
  ctx: ClmmpoolContext,
  poolCreateInfo: CreateClmmpoolParams,
  positions: FundedPositionParams[]
) {
  const arrayIndexSet = new Set<number>();
  positions.forEach((p) => {
    arrayIndexSet.add(
      TickUtil.getArrayIndex(p.tickLowerIndex, poolCreateInfo.tickSpacing)
    );
    arrayIndexSet.add(
      TickUtil.getArrayIndex(p.tickUpperIndex, poolCreateInfo.tickSpacing)
    );
  });

  return Promise.all(
    Array.from(arrayIndexSet).map((arrayIndex) =>
      initTickArray(ctx, poolCreateInfo.clmmpool, arrayIndex)
    )
  );
}

const defaultPoolCreateInfo: CreateClmmpoolParams = {
  initSqrtPrice: ZERO_BN,
  tickSpacing: 0,
  clmmConfig: PublicKey.default,
  tokenA: PublicKey.default,
  tokenB: PublicKey.default,
  clmmpool: PublicKey.default,
  tokenAVault: PublicKey.default,
  tokenBVault: PublicKey.default,
  feeTier: PublicKey.default,
  payer: PublicKey.default,
};

const defaultConfigCreateInfo: InitClmmConfigParams = {
  clmmConfig: PublicKey.default,
  protocolAuthority: PublicKey.default,
  protocolFeeClaimAuthority: PublicKey.default,
  createPoolAuthority: PublicKey.default,
  protocolFeeRate: 0,
  payer: PublicKey.default,
};

const defaultConfigKeypairs = {
  protocolAuthorityKeypair: Keypair.generate(),
  protocolClaimAuthorityKeypair: Keypair.generate(),
};
