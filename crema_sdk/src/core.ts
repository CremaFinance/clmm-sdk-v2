import type { IdlAccounts, Provider } from "@project-serum/anchor";
import { BorshCoder } from "@project-serum/anchor";
import type { ConfirmOptions, Signer } from "@solana/web3.js";
import { Transaction, TransactionInstruction } from "@solana/web3.js";

import type { Clmmpool } from "../../src/idls/clmmpool";
import { ClmmpoolIDL } from "../../src/idls/clmmpool";

export const ClmmCoder = new BorshCoder(ClmmpoolIDL);

export type Accounts = IdlAccounts<Clmmpool>;

export type FeeTierData = Accounts["feeTier"];
export type ClmmPoolData = Accounts["clmmpool"];
export type TickArrayData = Accounts["tickArray"];
export type ClmmConfigData = Accounts["clmmConfig"];

export class Instructions {
  constructor(
    public instructions: TransactionInstruction[],
    private provider?: Provider
  ) {}

  tx() {
    return new Transaction().add(...this.instructions);
  }

  add(...items: (TransactionInstruction | Transaction | Instructions)[]) {
    items.forEach((item) => {
      if (item instanceof TransactionInstruction) {
        this.instructions.push(item);
      } else {
        this.instructions.push(...item.instructions);
      }
    });
  }

  instruction() {
    if (this.instructions.length === 0) {
      throw new Error("no instruction available");
    }
    return this.instructions[0];
  }

  exec({
    signers,
    ...options
  }: ConfirmOptions & { signers?: (Signer | undefined)[] } = {}) {
    if (!this.provider) {
      throw new Error("provider not available");
    }
    return this.provider.send(this.tx(), signers, options);
  }
}
