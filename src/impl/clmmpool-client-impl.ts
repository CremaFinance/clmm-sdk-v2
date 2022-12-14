import type { Address } from "@project-serum/anchor";

import type { Clmmpool, ClmmpoolClient, Position } from "../clmmpool-client";
import type { ClmmpoolContext } from "../context";
import type { AccountFetcher } from "../network";
import type { ClmmpoolData } from "../types";
import { AddressUtil } from "../utils";
import { ClmmpoolImpl } from "./clmmpool-impl";
import { PositionImpl } from "./position-impl";
import { getTokenMintInfos, getTokenVaultAccountInfos } from "./util";

export class ClmmpoolClientImpl implements ClmmpoolClient {
  constructor(readonly ctx: ClmmpoolContext) {}

  getContext(): ClmmpoolContext {
    return this.ctx;
  }

  getFetcher(): AccountFetcher {
    return this.ctx.fetcher;
  }

  // Default refresh pool info every time.
  async getPool(poolAddress: Address, refresh = false): Promise<ClmmpoolImpl> {
    const account = await this.ctx.fetcher.getPool(poolAddress, refresh);
    if (!account) {
      throw new Error(`Unable to fetch clmmpool at address at ${poolAddress}`);
    }
    const tokenInfos: any = await getTokenMintInfos(
      this.ctx.fetcher,
      account,
      refresh
    );
    const vaultInfos: any = await getTokenVaultAccountInfos(
      this.ctx.fetcher,
      account,
      refresh
    );
      
    return new ClmmpoolImpl(
      this.ctx,
      this.ctx.fetcher,
      AddressUtil.toPubKey(poolAddress),
      tokenInfos[0],
      tokenInfos[1],
      vaultInfos[0],
      vaultInfos[1],
      account
    );
  }

  // Default refresh pools info every time.
  async getPools(
    poolAddresses: Address[],
    refresh = true
  ): Promise<Clmmpool[]> {
    const accounts = (
      await this.ctx.fetcher.listPools(poolAddresses, refresh)
    ).filter((account): account is ClmmpoolData => !!account);
    if (accounts.length !== poolAddresses.length) {
      throw new Error(
        `Unable to fetch all clmmpools at addresses ${poolAddresses}`
      );
    }
    const tokenMints = new Set<string>();
    const tokenAccounts = new Set<string>();
    accounts.forEach((account) => {
      tokenMints.add(account.tokenA.toBase58());
      tokenMints.add(account.tokenB.toBase58());
      tokenAccounts.add(account.tokenAVault.toBase58());
      tokenAccounts.add(account.tokenBVault.toBase58());
    });
    await this.ctx.fetcher.listMintInfos(Array.from(tokenMints), refresh);
    await this.ctx.fetcher.listTokenInfos(Array.from(tokenAccounts), refresh);

    const clmmpools: Clmmpool[] = [];
    for (let i = 0; i < accounts.length; i++) {
      const account:any = accounts[i];
      const poolAddress:any = poolAddresses[i];
      const tokenInfos:any = await getTokenMintInfos(
        this.ctx.fetcher,
        account,
        false
      );
      const vaultInfos:any = await getTokenVaultAccountInfos(
        this.ctx.fetcher,
        account,
        false
      );
      clmmpools.push(
        new ClmmpoolImpl(
          this.ctx,
          this.ctx.fetcher,
          AddressUtil.toPubKey(poolAddress),
          tokenInfos[0],
          tokenInfos[1],
          vaultInfos[0],
          vaultInfos[1],
          account
        )
      );
    }
    return clmmpools;
  }

  // Default refresh position info every time.
  async getPosition(
    positionAddress: Address,
    refresh = true
  ): Promise<Position> {
    const account = await this.ctx.fetcher.getPosition(
      positionAddress,
      refresh
    );
    if (!account) {
      throw new Error(
        `Unable to fetch Position at address at ${positionAddress}`
      );
    }
    return new PositionImpl(
      this.ctx,
      this.ctx.fetcher,
      AddressUtil.toPubKey(positionAddress),
      account
    );
  }
}
