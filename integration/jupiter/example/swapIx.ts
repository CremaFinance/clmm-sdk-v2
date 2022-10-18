import { ClmmpoolClientImpl, ClmmpoolContext, PDAUtil, simulateSwapWithProFeeRate, SwapUtils, TickUtil } from "@cremafinance/crema-sdk-v2";
import { SwapQuoteParam } from "@cremafinance/crema-sdk-v2/dist/esm/quotes/public/swap";
import { AccountInfo, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { CremaClmm } from "../src/clmm";
import { ClmmCoder } from "../src/core";
import { TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { Provider, SignerWallet, SolanaProvider } from "@cremafinance/solana-contrib";

import * as fs from "fs";
import { parse } from "yaml";

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
    const amount = new u64(10);

    // tick spacing will be provided. different clmmpool will have different tick spacings.
    const tickSpacing = 2;

    const clmmConfig = PDAUtil.getClmmConfigPDA(CREMA_PROGRAM_ID).publicKey;
    // USDT-USDC pool
    const clmmpool = PDAUtil.getClmmpoolPDA(CREMA_PROGRAM_ID, clmmConfig, tokenA, tokenB, tickSpacing).publicKey;
    const feeTier = PDAUtil.getFeeTierPDA(CREMA_PROGRAM_ID, clmmConfig, tickSpacing).publicKey;
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

    // fetch clmmpool 
    const clmmpoolAccountInfo = await connection.getAccountInfo(clmmpool);
    const clmmConfigAccountInfo = await connection.getAccountInfo(clmmConfig);
    const feeTierAccountInfo = await connection.getAccountInfo(feeTier);
    const clmm = new CremaClmm(clmmpool, clmmpoolAccountInfo!, clmmConfigAccountInfo!, feeTierAccountInfo!, {
        slippageTolerance: 0.01,
        decimalA: 6,//USDT
        decimalB: 6,//USDC
    });

    // update data
    const accountKeys = clmm.getAccountsForUpdate();
    const accounts = await connection.getMultipleAccountsInfo(accountKeys);
    const accountMap = toAccountInfoMap(accountKeys, accounts as (AccountInfo<Buffer> | null)[]);
    clmm.update(accountMap);

    // the token account of the user
    const accountA = new PublicKey("xxxxxxa");
    const accountB = new PublicKey("xxxxxxb");

    // tokenAVault and tokenBVault is in the clmmpool
    const clmmpoolData = ClmmCoder.accounts.decode(
      "clmmpool",
      clmmpoolAccountInfo!.data
    );

    // tickArrayMap address can calculated from programID and clmmpool address
    const tickArrayMap = PDAUtil.getTickArrayMapPDA(CREMA_PROGRAM_ID, clmmpool).publicKey;
    const tokenAVault = clmm.clmmpoolData.tokenAVault;
    const tokenBVault = clmm.clmmpoolData.tokenBVault;

    const owner = new PublicKey("user wallet address");

    // the owner of partnerAtaA and partnerAtaB
    const partner = new PublicKey("Jupiter account address");
    const partnerAtaA = new PublicKey("xxxxA");
    const partnerAtaB = new PublicKey("xxxxB");

    // get tick array index from current tick index in clmmpool info first.
    const arrayIndex = TickUtil.getArrayIndex(clmm.clmmpoolData.currentTickIndex, tickSpacing);

    // arrayCount means remain account's length which is tick array account. usually set 3 is enough. 
    const arrayCount = 3;

    const sqrtPriceLimit = SwapUtils.getDefaultSqrtPriceLimit(aToB);

    const sdk = await makeSDK();

    const swapQuoteParams: SwapQuoteParam = {
        clmmpoolData: clmm.clmmpoolData,
        tokenAmount: amount,
        sqrtPriceLimit,
        aToB,
        byAmountIn,
        tickArrays: clmm.tickArrays,
    };

    const swapQuote = simulateSwapWithProFeeRate(swapQuoteParams, clmm.protocolFeeRate);

    const amountLimit = byAmountIn ? swapQuote.estimatedAmountOut.mul(new u64(1 - clmm.slippageTolerance)) : swapQuote.estimatedAmountIn.mul(new u64(1 + clmm.slippageTolerance));

    const remainingAccounts = [];

    for (let i = 0; i < clmm.tickArrays.length; i++) {
        remainingAccounts.push({
          pubkey: clmm.tickArrays[i].address,
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