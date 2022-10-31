import type { Idl } from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { Provider, SolanaProvider, Wallet } from "@cremafinance/solana-contrib";
import type { ConfirmOptions, Connection, PublicKey } from "@solana/web3.js";

import type { clmmpool } from "./idls/clmmpool";
import ClmmpoolIDL from "./idls/clmmpool.json";
import { AccountFetcher } from "./network";

/**
 * The helpful class of clmmpool context.
 */
export class ClmmpoolContext {
  readonly connection: Connection;
  readonly wallet: Wallet;
  readonly opts: ConfirmOptions;
  readonly program: Program<clmmpool>;
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
      provider,
      anchorProvider.wallet,
      program,
      fetcher,
      opts
    );
  }

  static fromWorkspace(
    provider: Provider,
    program: Program,
    fetcher = new AccountFetcher(provider.connection),
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ):  ClmmpoolContext {
    return new ClmmpoolContext(
      provider,
      provider.wallet,
      program,
      fetcher,
      opts
    );
  }

  static withProvider(
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
    this.program = program as unknown as Program<clmmpool>;
    this.provider = provider;
    this.fetcher = fetcher;
  }
}
