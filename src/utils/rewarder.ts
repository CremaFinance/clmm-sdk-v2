import { PublicKey } from '@solana/web3.js'
import { ClmmpoolContext } from '../context'
import { MathUtil } from '../math'

// `listRewarderInfosFromClmmpool` returns all rewarders from a clmmpool.
export async function listRewarderInfosFromClmmpool(ctx: ClmmpoolContext, clmmpoolAddr: PublicKey) {
  const clmmpool: any = await ctx.fetcher.getPool(clmmpoolAddr, true)
  if (!clmmpool) {
    return null
  }

  const rewarderInfos: any = []
  for (const rewarderInfo of clmmpool.rewarderInfos) {
    rewarderInfos.push(rewarderInfo)
  }

  return rewarderInfos
}

// `emissionsEveryDay` returns the number of emissions every day.
export async function emissionsEveryDay(ctx: ClmmpoolContext, clmmpoolAddr: PublicKey) {
  const rewarderInfos: any = await listRewarderInfosFromClmmpool(ctx, clmmpoolAddr)
  if (!rewarderInfos) {
    return null
  }

  const emissionsEveryDay = []
  for (const rewarderInfo of rewarderInfos) {
    const emissionSeconds = MathUtil.fromX64(rewarderInfo.emissionsPerSecond)
    emissionsEveryDay.push({
      emissions: Math.floor(emissionSeconds.toNumber() * 60 * 60 * 24),
      mint: rewarderInfo.mint,
    })
  }

  return emissionsEveryDay
}

// listRewarderInfosFromPosition returns all rewarderInfos from a position.
export async function listRewarderInfosFromPosition(ctx: ClmmpoolContext, positionAddr: PublicKey) {
  const position: any = await ctx.fetcher.getPosition(positionAddr)
  if (!position) {
    return null
  }

  const rewarderInfos: any = []
  for (const rewarderInfo of position.rewarderInfos) {
    rewarderInfos.push(rewarderInfo)
  }

  return rewarderInfos
}

// collectRewarderInfos returns all(default is less or equal 3) rewarder_amounts from a position rewarder infos.
export async function collectRewarderAmount(ctx: ClmmpoolContext, positionAddr: PublicKey) {
  const rewarderInfos: any = await listRewarderInfosFromPosition(ctx, positionAddr)
  if (!rewarderInfos) {
    return null
  }

  const rewarderAmount: any = []
  for (const rewarderInfo of rewarderInfos) {
    rewarderAmount.push(rewarderInfo.amount_owed)
  }

  return rewarderAmount
}
