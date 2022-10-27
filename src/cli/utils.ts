import {  loadProvider } from "../../tests/utils";
import { ClmmpoolClientImpl } from "../impl/clmmpool-client-impl";
import { ClmmpoolContext } from "../context";
import { exit } from "process";
import { PublicKey } from '@solana/web3.js';

export const DEFAULT_SWAP_PROGRAM_ID =
  new PublicKey("CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR");
export async function makeSDK() {
    const provider = loadProvider();
    const ctx = ClmmpoolContext.withProvider(provider, DEFAULT_SWAP_PROGRAM_ID);
    const sdk = new ClmmpoolClientImpl(ctx)
    return sdk;
}

export function catchFinallyExit(pending: Promise<any>) {
    pending
        .catch((err) => {
            console.log(err);
        })
        .finally(() => {
            exit(0);
        });
}

export function printObjectJSON(ins?: any, maxDeep = 1) {
    let d = 0;
    const convertObjt = (ins?: any, deep = 0) => {
      const data = new Map<string, any>();
      for (const key in ins) {
        if (typeof ins[key] === "object" && deep < maxDeep) {
          d += 1;
          data.set(key, convertObjt(ins[key], d));
        } else {
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
