import type { Provider, TransactionEnvelope, TransactionReceipt } from "@cremafinance/solana-contrib";
import { Keypair } from "@solana/web3.js";
export declare function confirmTx(tx: TransactionEnvelope): Promise<TransactionReceipt>;
export declare function keypairFromFile(path: string): Keypair;
export declare function loadProvider(): Provider;
export declare function parseMessage(message: string): string;
