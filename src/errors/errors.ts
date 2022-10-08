export enum MathErrorCode {
  IntegerDowncastOverflow = `IntegerDowncastOverflow`,
  MulOverflow = `MultiplicationOverflow`,
  MulDivOverflow = `MulDivOverflow`,
  MulShiftRightOverflow = `MulShiftRightOverflow`,
  MulShiftLeftOverflow = `MulShiftLeftOverflow`,
  DivideByZero = `DivideByZero`,
  UnsignedIntegerOverflow = `UnsignedIntegerOverflow`,
}

export enum TokenErrorCode {
  TokenAmountMaxExceeded = `TokenAmountMaxExceeded`,
  TokenAmountMinSubceeded = `TokenAmountMinSubceeded `,
  SqrtPriceOutOfBounds = `SqrtPriceOutOfBounds`,
}

export enum SwapErrorCode {
  InvalidSqrtPriceLimitDirection = `InvalidSqrtPriceLimitDirection`,
  SqrtPriceOutOfBounds = `SqrtPriceOutOfBounds`,
  ZeroTradableAmount = `ZeroTradableAmount`,
  AmountOutBelowMinimum = `AmountOutBelowMinimum`,
  AmountInAboveMaximum = `AmountInAboveMaximum`,
  NextTickNotFound = `NextTickNoutFound`,
  TickArraySequenceInvalid = `TickArraySequenceInvalid`,
  TickArrayCrossingAboveMax = `TickArrayCrossingAboveMax`,
  TickArrayIndexNotInitialized = `TickArrayIndexNotInitialized`,
}

export type ClmmpoolsErrorCode = MathErrorCode | SwapErrorCode | TokenErrorCode;

export class ClmmpoolsError extends Error {
  override message: string;
  errorCode?: ClmmpoolsErrorCode;
  constructor(message: string, errorCode?: ClmmpoolsErrorCode) {
    super(message);
    this.message = message;
    this.errorCode = errorCode;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isClmmpoolsErrorCode(e: any, code: ClmmpoolsErrorCode): boolean {
    return e instanceof ClmmpoolsError && e.errorCode === code;
  }
}
