import {  loadProvider } from "../../tests/utils";
import { ClmmpoolClientImpl } from "../impl/clmmpool-client-impl";
import { ClmmpoolContext } from "../context";
import { exit } from "process";
// import * as fs from "fs";
// import { parse } from "yaml";
// import { SignerWallet } from "@cremafinance/solana-contrib";
import { PublicKey } from '@solana/web3.js';
// import { Address } from "@project-serum/anchor";
export const DEFAULT_SWAP_PROGRAM_ID =
  new PublicKey("CcLs6shXAUPEi19SGyCeEHU9QhYAWzV2dRpPPNA4aRb7");
export async function makeSDK() {
    const provider = loadProvider();
    const ctx = ClmmpoolContext.withProvider(provider, DEFAULT_SWAP_PROGRAM_ID);
    const sdk = new ClmmpoolClientImpl(ctx)
    return sdk;
}

// export async function loadPoolSdk(poolAddress:Address) {
//   const provider = loadProvider();
//   const ctx = ClmmpoolContext.withProvider(provider, DEFAULT_SWAP_PROGRAM_ID);
//   const sdk = new ClmmpoolClientImpl(ctx)
//   const poolSdk = sdk.getPool(poolAddress)
//   return poolSdk;
// }

// export async function loadPositionSdk(poolAddress:Address) {
//   const provider = loadProvider();
//   const ctx = ClmmpoolContext.withProvider(provider, DEFAULT_SWAP_PROGRAM_ID);
//   const sdk = new ClmmpoolClientImpl(ctx)
//   const positionSdk = sdk.getPosition(poolAddress)
//   return positionSdk;
// }

export function catchFinallyExit(pending: Promise<any>) {
    pending
        .catch((err) => {
            console.log(err);
        })
        .finally(() => {
            exit(0);
        });
}

/*eslint-disable  @typescript-eslint/no-explicit-any */
export function printObjectJSON(ins?: any, maxDeep = 1) {
    let d = 0;
    const convertObjt = (ins?: any, deep = 0) => {
      const data = new Map<string, any>();
      for (const key in ins) {
        /*eslint-disable  @typescript-eslint/no-unsafe-call*/
        if (typeof ins[key] === "object" && deep < maxDeep) {
          d += 1;
          data.set(key, convertObjt(ins[key], d));
        } else {
          /*eslint-disable  @typescript-eslint/no-unsafe-call*/
          if (ins[key] === null) {
            data.set(key.toString(), null);
            continue;
          }
          data.set(key.toString(), ins[key].toString());
        }
      }
      return Object.fromEntries(data);
    };
  }


  