use thiserror::Error;

/// `ErrorCode` is the error type for the `clmmpool` program.
#[derive(Debug, Error)]
pub enum ErrorCode {
    #[error("LOK")]
    LOK,

    #[error("Unable to cast number into BigInt")]
    NumberCastError, //  0x1777

    #[error("Minting amount should be greater than 0")]
    ZeroMintAmount,

    #[error("Integer downcast overflow")]
    IntegerDowncastOverflow,

    // Multiplication overflow
    #[error("Multiplication overflow")]
    MultiplicationOverflow,

    #[error("Divisor is zero")]
    DivisorIsZero,

    #[error("Token amount min subceeded")]
    TokenAmountMinSubceeded,

    #[error("Token amount max exceeded")]
    TokenAmountMaxExceeded,

    #[error("Input sqrt price out of bounds")]
    SqrtPriceOutOfBounds,

    #[error("Protocol fee rate illegal")]
    ProtocolFeeRateIllegal,

    #[error("Fee rate illegal")]
    FeeRateIllegal,

    #[error("Token mint pair illegal")]
    TokenMintPairIllgal,

    #[error("Tickarray start_index is illegal")]
    TickArrayStartIndexIllegal,

    #[error("Invalid tick spacing")]
    InvalidTickSpacing,

    #[error("Invalid tick index")]
    InvalidTickIndex,

    #[error("Invalid tick array account")]
    InvalidTickArrayAccount,

    #[error("Position is not empty")]
    PositionIsNotEmpty,

    #[error("Invalid Token account owner")]
    InvalidTokenAccountOwner,

    #[error("Tick not found")]
    TickNotFound,

    #[error("Tick not in array")]
    TickNotInArray,

    #[error("Invalid token account")]
    InvalidTokenAccount,

    #[error("Invalid mint")]
    InvalidMint,

    #[error("Invalid authority")]
    InvalidAuthority,

    #[error("Position and clmmpool not match")]
    PositionAndClmmpoolNotMatch,

    #[error("Position is Illegal")]
    PositionIllegal,

    #[error("Invalid delta liquidity")]
    InvalidDeltaLiquidity,

    #[error("Config and Pool not match")]
    ConfigAndPoolNotMatch,
    #[error("Wrong sqrt price limit")]
    WrongSqrtPriceLimit,

    #[error("Tick array not found")]
    TickArrayNotFound,

    #[error("Invalid tick array index")]
    InvalidTickArrayIndex,

    #[error("Next tick not found")]
    NextTickNotFound,

    #[error("Fee growth illegal")]
    FeeGrowthIllegal,

    #[error("Liquidity overflow")]
    LiquidityOverflow,

    #[error("Liquidity underflow")]
    LiquidityUnderflow,

    #[error("Remainer amount underflow")]
    RemainerAmountUnderflow,

    #[error("Swap amount in overflow")]
    SwapAmountInOverflow,

    #[error("Swap amount out overflow")]
    SwapAmountOutOverflow,

    #[error("Swap fee amount overflow")]
    SwapFeeAmountOverflow,

    #[error("Invalid time")]
    InvalidTime,

    #[error("Amount in above maximum limit")]
    AmountInAboveMaximumLimit,

    #[error("Amount out below maximum limit")]
    AmountOutBelowMaximumLimit,

    // new add
    #[error("Invalid amount input")]
    InvalidAmountInput,

    #[error("Invalid fixed token type")]
    InvalidFixedTokenType,
}
