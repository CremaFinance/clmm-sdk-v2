import type { Address } from "@project-serum/anchor";
import type { TransactionEnvelope } from "@cremafinance/solana-contrib";
import type { PublicKey } from "@solana/web3.js";

import type { ClmmpoolContext } from "./context";
import type { AccountFetcher } from "./network";
import type { SwapQuote } from "./quotes";
import type {
  ClmmpoolData,
  DecreaseLiquidityInput,
  // DecreaseLiquidityInput,
  IncreaseLiquidityInput,
  PositionData,
} from "./types";
import type { TokenAccountInfo, TokenInfo } from "./types/client-types";
import { SwapInput } from "./ix";

/**
 * Helper class to help interact with Clmmpool Accounts with a simpler interface.
 *
 * @category Core
 */
export interface ClmmpoolClient {
  /**
   * Get this client's ClmmpoolContext object
   * @return a ClmmpoolContext object
   */
  getContext: () => ClmmpoolContext;

  /**
   * Get an AccountFetcher to fetch Clmmpool accounts
   * @return an AccountFetcher instance
   */
  getFetcher: () => AccountFetcher;

  // initializePool: () => Promise<TransactionEnvelope>;

  /**
   * Get a Clmmpool object to interact with the Clmmpool account at the given address.
   * @param poolAddress the address of the Clmmpool account
   * @return a Clmmpool object to interact with
   */
  getPool: (poolAddress: Address, refresh?: boolean) => Promise<Clmmpool>;

  /**
   * Get a list of Clmmpool objects matching the provided list of addresses.
   * @param poolAddresses the addresses of the Clmmpool accounts
   * @return a list of Clmmpool objects to interact with
   */
  getPools: (
    poolAddresses: Address[],
    refresh?: boolean
  ) => Promise<Clmmpool[]>;

  /**
   * Get a Position object to interact with the Position account at the given address.
   * @param positionAddress the address of the Position account
   * @return a Position object to interact with
   */
  getPosition: (
    positionAddress: PublicKey,
    refresh?: boolean
  ) => Promise<Position>;
}

/**
 * Helper class to interact with a Clmmpool account and build complex transactions.
 * @category ClmmpoolClient
 */
export interface Clmmpool {
  /**
   * Return the address for this Clmmpool instance.
   * @return the PublicKey for this Clmmpool instance.
   */
  getAddress: () => PublicKey;

  /**
   * Return the most recently fetched Clmmpool account data.
   * @return most recently fetched ClmmpoolData for this address.
   */
  getData: () => ClmmpoolData;

  /**
   * Fetch and return the most recently fetched Clmmpool account data.
   * @return the most up to date ClmmpoolData for this address.
   */
  refreshData: () => Promise<ClmmpoolData>;

  /**
   * Get the TokenInfo for token A of this pool.
   * @return TokenInfo for token A
   */
  getTokenAInfo: () => TokenInfo;

  /**
   * Get the TokenInfo for token B of this pool.
   * @return TokenInfo for token B
   */
  getTokenBInfo: () => TokenInfo;

  /**
   * Get the TokenAccountInfo for token vault A of this pool.
   * @return TokenAccountInfo for token vault A
   */
  getTokenVaultAInfo: () => TokenAccountInfo;

  /**
   * Get the TokenAccountInfo for token vault B of this pool.
   * @return TokenAccountInfo for token vault B
   */
  getTokenVaultBInfo: () => TokenAccountInfo;

  /**
   * Initialize a set of tick-arrays that encompasses the provided ticks.
   *
   * If `funder` is provided, the funder wallet has to sign this transaction.
   *
   * @param ticks - A group of ticks that define the desired tick-arrays to initialize. If the tick's array has been initialized, it will be ignored.
   * @param funder - the wallet that will fund the cost needed to initialize the position. If null, the ClmmpoolContext wallet is used.
   * @param refresh - whether this operation will fetch for the latest accounts if a cache version is available.
   * @return a transaction that will initialize the defined tick-arrays if executed. Return null if all of the tick's arrays are initialized.
   */
  // initTickArrayForTicks: (
  //   ticks: number[],
  //   funder?: Address,
  //   refresh?: boolean
  // ) => Promise<TransactionEnvelope | null>;

  /**
   * Open and fund a position on this Clmmpool.
   *
   * User has to ensure the TickArray for tickLower and tickUpper has been initialized prior to calling this function.
   *
   * If `wallet` or `funder` is provided, those wallets have to sign this transaction.
   *
   * @param tickLower - the tick index for the lower bound of this position
   * @param tickUpper - the tick index for the upper bound of this position
   * @param liquidityInput - an InputLiquidityInput type to define the desired liquidity amount to deposit
   * @param wallet - the wallet to withdraw tokens to deposit into the position and house the position token. If null, the ClmmpoolContext wallet is used.
   * @param funder - the wallet that will fund the cost needed to initialize the position. If null, the ClmmpoolContext wallet is used.
   * @return `positionMint` - the position to be created. `tx` - The transaction containing the instructions to perform the operation on chain.
   */
  openPosition: (
    tickLower: number,
    tickUpper: number,
    liquidityInput: IncreaseLiquidityInput,
    isAFixed: boolean
    // wallet?: Address,
    // funder?: Address
    // ) => Promise<{ positionMint: PublicKey; tx: TransactionEnvelope }>;
  ) => Promise<TransactionEnvelope>;
  /**
   * Open and fund a position with meta-data on this Clmmpool.
   *
   * User has to ensure the TickArray for tickLower and tickUpper has been initialized prior to calling this function.
   *
   * If `wallet` or `funder` is provided, the wallet owners have to sign this transaction.
   *
   * @param tickLower - the tick index for the lower bound of this position
   * @param tickUpper - the tick index for the upper bound of this position
   * @param liquidityInput - input that defines the desired liquidity amount and maximum tokens willing to be to deposited.
   * @param wallet - the wallet to withdraw tokens to deposit into the position and house the position token. If null, the ClmmpoolContext wallet is used.
   * @param funder - the wallet that will fund the cost needed to initialize the position. If null, the ClmmpoolContext wallet is used.
   * @return `positionMint` - the position to be created. `tx` - The transaction containing the instructions to perform the operation on chain.
   */

  closePosition: (
    liquidityInput: DecreaseLiquidityInput,
    positionId: PublicKey,
    positionNftMint: PublicKey,
    swapKey: PublicKey
  ) => Promise<TransactionEnvelope>;

  /**
   * Perform a swap between tokenA and tokenB on this pool.
   *
   * @param quote - A quote on the desired tokenIn and tokenOut for this swap. Use @link {swapQuote} to generate this object.
   * @param wallet - The wallet that tokens will be withdrawn and deposit into. If null, the ClmmpoolContext wallet is used.
   * @return a transaction that will perform the swap once executed.
   */
  swap: (quote: SwapInput, wallet?: PublicKey) => Promise<TransactionEnvelope>;
}

/**
 * Helper class to interact with a Position account and build complex transactions.
 * @category ClmmpoolClient
 */
export interface Position {
  /**
   * Return the address for this Clmmpool instance.
   * @return the PublicKey for this Clmmpool instance.
   */
  getAddress: () => PublicKey;

  /**
   * Return the most recently fetched Position account data.
   * @return most recently fetched PositionData for this address.
   */
  getData: () => PositionData;

  /**
   * Fetch and return the most recently fetched Position account data.
   * @return the most up to date PositionData for this address.
   */
  refreshData: () => Promise<PositionData>;

  /**
   * Deposit additional tokens into this postiion.
   * The wallet must contain the position token and the necessary token A & B to complete the deposit.
   * If  `positionWallet` and `wallet` is provided, the wallet owners have to sign this transaction.
   *
   * @param liquidityInput - input that defines the desired liquidity amount and maximum tokens willing to be to deposited.
   * @param resolveATA - if true, add instructions to create associated token accounts for tokenA,B for the destinationWallet if necessary. (RPC call required)
   * @param wallet - to withdraw tokens to deposit into the position. If null, the ClmmpoolContext wallet is used.
   * @param positionWallet - the wallet to that houses the position token. If null, the ClmmpoolContext wallet is used.
   * @param ataPayer - wallet that will fund the creation of the new associated token accounts
   * @return the transaction that will deposit the tokens into the position when executed.
   */
  increaseLiquidity: (
    liquidityInput: IncreaseLiquidityInput,
    positionId: PublicKey,
    positionNftMint: PublicKey,
    swapPair: PublicKey,
    isAFixed: boolean
  ) => Promise<TransactionEnvelope>;

  /**
   * Withdraw liquidity from this position.
   *
   * If `positionWallet` is provided, the wallet owners have to sign this transaction.
   *
   * @param liquidityInput - input that defines the desired liquidity amount and minimum tokens willing to be to withdrawn from the position.
   * @param resolveATA -  if true, add instructions to create associated token accounts for tokenA,B for the destinationWallet if necessary. (RPC call required)
   * @param destinationWallet - the wallet to deposit tokens into when withdrawing from the position. If null, the ClmmpoolContext wallet is used.
   * @param positionWallet - the wallet to that houses the position token. If null, the ClmmpoolContext wallet is used.
   * @param ataPayer - wallet that will fund the creation of the new associated token accounts
   * @return the transaction that will deposit the tokens into the position when executed.
   */

  decreaseLiquidity: (
    liquidityInput: DecreaseLiquidityInput,
    positionId: PublicKey,
    positionNftMint: PublicKey,
    swapPair: PublicKey
  ) => Promise<TransactionEnvelope>;

  claim: (
    positionId: PublicKey,
    positionNftMint: PublicKey,
    swapKey: PublicKey
  ) => Promise<TransactionEnvelope>;
  // TODO: Implement Collect fees
}
