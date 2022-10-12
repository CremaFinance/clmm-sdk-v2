import type { Idl } from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import type { Provider, Wallet } from "@cremafinance/solana-contrib";
import { SolanaProvider } from "@cremafinance/solana-contrib";
// import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import type { ConfirmOptions, Connection, PublicKey } from "@solana/web3.js";

import type { Clmmpool } from "./idls/clmmpool";
import ClmmpoolIDL from "./idls/clmmpool.json";
import { AccountFetcher } from "./network";
/**
 * @category Core
 */
export class ClmmpoolContext {
  readonly connection: Connection;
  readonly wallet: Wallet;
  readonly opts: ConfirmOptions;
  readonly program: Program<Clmmpool>;
  // readonly provider: AnchorProvider;
  readonly provider: Provider;
  readonly fetcher: AccountFetcher;

  static from(
    connection: Connection,
    wallet: Wallet,
    programId: PublicKey,
    fetcher = new AccountFetcher(connection),
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ): ClmmpoolContext {
    const anchorProvider = new AnchorProvider(connection, wallet, opts);
    const provider = SolanaProvider.init({ connection, wallet, opts });
    const program = new Program(ClmmpoolIDL as Idl, programId, anchorProvider);
    return new ClmmpoolContext(
      // anchorProvider,
      provider,
      anchorProvider.wallet,
      program,
      fetcher,
      opts
    );
  }

  static fromWorkspace(
    // provider: AnchorProvider,
    provider: Provider,
    program: Program,
    fetcher = new AccountFetcher(provider.connection),
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {
    return new ClmmpoolContext(
      provider,
      provider.wallet,
      program,
      fetcher,
      opts
    );
  }

  static withProvider(
    // provider: AnchorProvider,
    provider: Provider,
    programId: PublicKey,
    fetcher = new AccountFetcher(provider.connection),
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ): ClmmpoolContext {
    const anchorProvider = new AnchorProvider(
      provider.connection,
      provider.wallet,
      opts
    );
    // const program = new Program(ClmmpoolIDL as Idl, programId, provider);
    const program = new Program(ClmmpoolIDL as Idl, programId, anchorProvider);
    return new ClmmpoolContext(
      provider,
      provider.wallet,
      program,
      fetcher,
      opts
    );
  }

  constructor(
    // provider: AnchorProvider,
    provider: Provider,
    wallet: Wallet,
    program: Program,
    fetcher: AccountFetcher,
    opts: ConfirmOptions
  ) {
    this.connection = provider.connection;
    this.wallet = wallet;
    this.opts = opts;
    // It's a hack but it works on Anchor workspace *shrug*
    this.program = program as unknown as Program<Clmmpool>;
    this.provider = provider;
    this.fetcher = fetcher;
  }

  // TODO: Add another factory method to build from on-chain IDL
}
