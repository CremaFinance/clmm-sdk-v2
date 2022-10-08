import type {
  BroadcastOptions,
  Provider,
  TransactionEnvelope,
  TransactionReceipt,
} from "@saberhq/solana-contrib";
import { SignerWallet, SolanaProvider } from "@saberhq/solana-contrib";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import invariant from "tiny-invariant";
import { parse } from "yaml";

export async function confirmTx(
  tx: TransactionEnvelope
): Promise<TransactionReceipt> {
  const opt: BroadcastOptions = {
    skipPreflight: true,
    commitment: "confirmed",
    preflightCommitment: "confirmed",
    maxRetries: 30,
    printLogs: true,
  };

  return await tx.confirm(opt);
}

export function keypairFromFile(path: string): Keypair {
  const secret = fs.readFileSync(path, "utf-8");
  const arr: Uint8Array = JSON.parse(secret);
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

export function loadProvider(): Provider {
  invariant(process.env.HOME !== undefined);
  const home: string = process.env.HOME;
  const configFile = fs.readFileSync(
    `${home}/.config/solana/cli/config.yml`,
    "utf8"
  );
  const config = parse(configFile);
  const url = getURL(config.json_rpc_url);
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
      return clusterApiUrl(cluster, true);
    }
    case "localnet": {
      return "http://localhost:8899";
    }
  }
  return cluster;
}

export function parseMessage(message: string): string {
  const index0 = message.indexOf("Custom");
  const index1 = message.indexOf("}]}})");

  const error_code = message.substring(index0 + 8, index1);
  return error_code;
}
