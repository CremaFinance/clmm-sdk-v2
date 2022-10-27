import { ClmmpoolClientImpl, ClmmpoolContext, PDAUtil, SwapUtils, TickUtil, IDL } from "@cremafinance/crema-sdk-v2";
import { AccountInfo, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { CremaClmm } from "../src/clmm";
import { ClmmCoder } from "../src/core";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Provider, SignerWallet, SolanaProvider } from "@cremafinance/solana-contrib";

import * as fs from "fs";
import { parse } from "yaml";
import BN = require("bn.js");
import { QuoteParams, SwapMode } from "../src";
import JSBI from "jsbi";

const CREMA_PROGRAM_ID: any = new PublicKey("CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR");

const USDT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
const USDC = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

async function createSwapInstruction() {
  // two token mints
  const tokenA = USDT;
  const tokenB =USDC;
  // swap parameters
  const aToB = true;
  const byAmountIn = true;
  // user input amount
  const amount = new BN(10);

  // tick spacing will be provided. different clmmpool will have different tick spacings.
  const tickSpacing = 2;

  const clmmConfig = PDAUtil.getClmmConfigPDA(CREMA_PROGRAM_ID).publicKey;
  const clmmpool = PDAUtil.getClmmpoolPDA(CREMA_PROGRAM_ID, clmmConfig, tokenA, tokenB, tickSpacing).publicKey;
  const feeTier = PDAUtil.getFeeTierPDA(CREMA_PROGRAM_ID, clmmConfig, tickSpacing).publicKey;
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

  // fetch clmmpool 
  const clmmpoolInfo = await connection.getAccountInfo(clmmpool);
  const clmmConfigInfo = await connection.getAccountInfo(clmmConfig);
  const feeTierInfo = await connection.getAccountInfo(feeTier);

  // create sdk (clmmpool client), then simulate swap;
  const sdk = await makeSDK();
  const pool = await sdk.getPool(clmmpool, true);
  await pool.simulateSwap(aToB, byAmountIn, amount);
  
  // tokenAVault and tokenBVault is in the clmmpool
  const clmmpoolData = ClmmCoder.accounts.decode(
    "clmmpool",
    clmmpoolInfo!.data
  );

  const cremaClmm = new CremaClmm(clmmpool, clmmpoolInfo!, clmmConfigInfo!, feeTierInfo!, 
    pool.tickArrays, 
    {
      slippageTolerance: 0.01,
      decimalA: 6,//USDT
      decimalB: 6,//USDC
    }
  );

  // update data
  const accountKeys = cremaClmm.getAccountsForUpdate();
  const accounts = await connection.getMultipleAccountsInfo(accountKeys);
  const accountMap = toAccountInfoMap(accountKeys, accounts as (AccountInfo<Buffer> | null)[]);
  cremaClmm.update(accountMap);
  
  const quoteParams: QuoteParams = {
    sourceMint: aToB?tokenA:tokenB,
    destinationMint: aToB?tokenB:tokenA,
    amount:  JSBI.BigInt(amount),
    swapMode: byAmountIn?SwapMode.ExactIn:SwapMode.ExactOut,
  }

  const swapQuote = cremaClmm.getQuote(quoteParams);

  // the token account of the user
  const accountA = new PublicKey("xxxxxxa");
  const accountB = new PublicKey("xxxxxxb");
  // tickArrayMap address can calculated from programID and clmmpool address
  const tickArrayMap = PDAUtil.getTickArrayMapPDA(CREMA_PROGRAM_ID, clmmpool).publicKey;
  const tokenAVault = clmmpoolData.tokenAVault;
  const tokenBVault = clmmpoolData.tokenBVault;
  const owner = new PublicKey("user wallet address");
  // the owner of partnerAtaA and partnerAtaB
  const partner = new PublicKey("Jupiter account address");
  const partnerAtaA = new PublicKey("xxxxA");
  const partnerAtaB = new PublicKey("xxxxB");
  const sqrtPriceLimit = SwapUtils.getDefaultSqrtPriceLimit(aToB);
  const amountLimit = byAmountIn 
  ? (new BN(swapQuote.inAmount.toString())).mul(clmmpoolData.slippageTolerance) 
  : (new BN(swapQuote.outAmount.toString())).mul(1 + clmmpoolData.slippageTolerance);

  const remainingAccounts = [];
  for (let i = 0; i < pool.tickArrays.length; i++) {
      remainingAccounts.push({
        pubkey: clmmpoolData.tickArrays[i].address,
        isWritable: false,
        isSigner: false,
      });
  }

  const ix = sdk.ctx.program.instruction.swapWithPartner(
    aToB,
    byAmountIn,
    amount,
    amountLimit,
    sqrtPriceLimit,
    {
      accounts: {
        clmmConfig,
        clmmpool,
        tokenA,
        tokenB,
        accountA,
        accountB,
        tokenAVault,
        tokenBVault,
        tickArrayMap,
        owner,
        partner,
        partnerAtaA,
        partnerAtaB,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      remainingAccounts,
    }
  );
}

function toAccountInfoMap(keys: PublicKey[], accounts: (AccountInfo<Buffer> | null)[]) {
  const accountMap = new Map<string, AccountInfo<Buffer>>();
  accounts.forEach((account, index) => account && accountMap.set(keys[index].toString(), account));
  return accountMap;
}

export function loadProvider(): Provider {
    const url = "https://api.mainnet-beta.solana.com";
    const home = process.env.HOME;
    const configFile = fs.readFileSync(
      `${home}/.config/solana/cli/config.yml`,
      "utf8"
    );
    const config = parse(configFile);
    const wallet = new SignerWallet(keypairFromFile(config.keypair_path));

    const provider: any = SolanaProvider.init({
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
    return provider
  }

export function makeSDK() {
    const provider: any = loadProvider();
    const ctx = ClmmpoolContext.fromWorkspace(provider, CREMA_PROGRAM_ID);
    const sdk = new ClmmpoolClientImpl(ctx)
    return sdk;
}

export function keypairFromFile(path: string): Keypair {
    const secret = fs.readFileSync(path, "utf-8");
    const arr: Uint8Array = JSON.parse(secret);
    return Keypair.fromSecretKey(Uint8Array.from(arr));
}