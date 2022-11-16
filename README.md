[![LICENSE](https://img.shields.io/badge/license-Apache2-green)](./LICENSE)
[![crema](https://img.shields.io/badge/protocol-crema-blue)](https://www.crema.finance/)
[![language](https://img.shields.io/badge/Language-typescript-blue)](https://www.typescriptlang.org/)

# What is Crema-SDK-V2

CLMM means concentrated liquidity market maker, it's crema sdk for new swap protocal. **[Crema](https://www.crema.finance/)** is a open-source concentrated liquidity market maker on the **Solana BlockChain** . The new version of crema increases the capital efficiency of decentralized exchanges.

This repository contains the typescript sdk(**@cremafinance/crema-sdk-v2**), which help you interact with a deployed program.

# How to use Crema-SDK-V2?

## Installation

```
npm add @cremafinance/crema-sdk-v2
```

## Test

You can use `npm test` to test crema instructions in `./test/instructions`.

## Use case:

We will show you the pseudocode example, specific method of application you can read `./integration/jupiter/example` or `./tests/instructions/xx.test.ts`

### Pseudocode Example

```
    // swap quote structa
    // import type { SwapQuote, SwapQuoteParam } from "@cremafinance/crema-sdk-v2/quote/public/swap";
    type SwapQuote = {
        estimatedAmountIn: u64;
        estimatedAmountOut: u64;
        estimatedEndSqrtPrice: BN;
        estimatedFeeAmount: u64;
        isExceed: boolean;
        aToB: boolean;
        byAmountIn: boolean;
        amount: BN;
    };

    const ix = sdk.ctx.program.instruction.swapWithPartner(
        aToB,           // weather change token_a for token_b
        byAmountIn,     // weather amount of fixed input
        amount,         // the amount of token
        amountLimit,    // calculate by simulate swap quote result and slippage
        sqrtPriceLimit, // max or min sqrt price limit(depend on aToB)
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
            tickArrayMap, // get this account by getTickArrayMapPDA(...).publicKey
            owner,
            partner,      // partner of integration
            partnerAtaA,  // partner's associated token account of token_a
            partnerAtaB,  // partner's associated token account of token_b
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          // Get tick arrays address by createTickArrayRange first, then get theirs account data by fetcher,getTickData().
          remainingAccounts,
        }
      );
```

# Structure

```
|____integration
| |____jupiter
|____src
| |____cli
| |____errors
| |____idls
| | |____clmmpool.json
| | |____clmmpool.ts
| |____impl
| |____math
| |____network
| |____quotes
| | |____public
| |____types
| |____utils
| |____clmmpool-client.ts
| |____context.ts
| |____index.ts
| |____ix.ts
|____test
| |____instructions
| |____utils
|____package.json
|____README.md
```

## Folder Details

- intergation: the sdk interface of the dex intergation, such as jupiter.
- src: the main content of crema sdk v2.
  - cli: The cli to develop complete applications.
  - error: The error type in crema program.
  - idls: Definition Language–IDL–specification.
  - impl: The functions implemented for frontbank.
  - math: All math arithmetic funcitions.
  - network: All functions about get some information from solana newwork.
  - quotes: Some functions about increase/decrease liquidity.
  - types: All type definition about program.
  - utils: All helpful utils.
  - context: The functions of clmmpool context.
  - ix.ts: All instruction definition interfaces.
- test: the test case of crema instruction.
  - instructions: Some test case of crema instructions.
  - utils: Some utils function used to test.
- package.json
- README.md

# Community

You can join these groups and chats to discuss and ask clmm-sdk-v2 related questions:

- [Discard](https://discord.com/channels/898196754678284308/910120408785760266)
- [Twitter Channel](https://twitter.com/Crema_Finance)
- [Medium](https://medium.com/@Crema.finance)
- [Telegram Community](https://t.me/cremafinance)

# License

Crema-SDK-V2 is under the Apache 2.0 license. See the [LICENSE](./LICENSE) file for details.
