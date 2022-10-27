import * as fs from "fs";
import { u64 } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import { SignerWallet, SolanaProvider } from "@cremafinance/solana-contrib";
import { Connection, Keypair } from "@solana/web3.js";
import type { Provider } from "@cremafinance/solana-contrib";

import { ClmmpoolContext } from "../context";
import type { TickArray } from "../types";

import { parse } from "yaml";
import { AnchorProvider, Program } from "@project-serum/anchor";
import ClmmpoolIDL  from "../idls/clmmpool.json";
import * as anchor from "@project-serum/anchor";
import { ClmmpoolClientImpl } from "../impl/clmmpool-client-impl";

describe("swap_with_partner", () => {
  const provider = loadProvider();
  const programId = new PublicKey("CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR");

  const opts = AnchorProvider.defaultOptions();
  const anchorProvider = new AnchorProvider(
    provider.connection,
    provider.wallet,
    opts,
  );
  const program = new Program(ClmmpoolIDL as anchor.Idl, programId, anchorProvider);
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);

  it("test simulate swap", async () => {
    const clmmpoolAddr = new PublicKey(
      "PxQamXYLP1KVcv7Adi1adCpx8CPtsMbtdsXQ4BgZNCb"
    );
    const clmmpoolData = await ctx.fetcher.getPool(clmmpoolAddr, true);
    const tokenAmount = new u64(59000000000);
    const aToB = true;
    const byAmountIn = false;
      
    const clmmpool = new ClmmpoolClientImpl(ctx);
    const pool = await clmmpool.getPool(clmmpoolAddr, true);
    const swapQuote = await pool.simulateSwap(aToB, byAmountIn, tokenAmount);

    console.log(swapQuote.estimatedAmountIn.toString(), "===> amountIn");
    console.log(swapQuote.estimatedAmountOut.toString(), "===> amountOut");
    console.log(swapQuote.estimatedEndSqrtPrice.toString(), "====>end sqrt price");
    console.log(swapQuote.estimatedFeeAmount.toString(), "=====>feeAmount");
    console.log(swapQuote.isExceed, "is exceed");
  });
});

function loadProvider(): Provider {
    const home: string = process.env.HOME!;
    const configFile = fs.readFileSync(
      `${home}/.config/solana/cli/config.yml`,
      "utf8"
    );
    const config = parse(configFile);
    const url = getURL('mainnet-beta');
    const wallet = new SignerWallet(keypairFromFile(config.keypair_path));
    const provider = SolanaProvider.init({
      connection: new Connection(url, {
        commitment: "recent",
        disableRetryOnRateLimit: true,
        confirmTransactionInitialTimeout: 60 * 1000,
      }),
      wallet,
      opts: {
        preflightCommitment: "recent",
        commitment: "recent",
      },
    });
    return provider;
  }

function getURL(cluster: string): string {
  switch (cluster) {
    case "devnet": {
        return "https://api.devnet.rpcpool.com/2ee3d7c0b48f6c361a06459b1d77";
    }
    case "testnet":
    case "mainnet-beta": {
        return "https://crema.rpcpool.com/f4eb0fdde53d6e1ecae674edd55e"
    }
    case "localnet": {
        return "http://localhost:8899";
    }
  }
  return cluster;
}

export function keypairFromFile(path: string): Keypair {
    const secret = fs.readFileSync(path, "utf-8");
    const arr: Uint8Array = JSON.parse(secret);
    return Keypair.fromSecretKey(Uint8Array.from(arr));
}