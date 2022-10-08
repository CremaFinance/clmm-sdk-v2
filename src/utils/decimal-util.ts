import { u64 } from "@solana/spl-token";
import Decimal from "decimal.js";

/**
 * @category Decimal Util
 */
export class DecimalUtil {
  static adjustDecimals(input: Decimal, shift = 0): Decimal {
    return input.div(Decimal.pow(10, shift));
  }

  static fromU64(input: u64, shift = 0): Decimal {
    return new Decimal(input.toString()).div(new Decimal(10).pow(shift));
  }

  static fromNumber(input: number, shift = 0): Decimal {
    return new Decimal(input).div(new Decimal(10).pow(shift));
  }

  static toU64(input: Decimal, shift = 0): u64 {
    if (input.isNeg()) {
      throw new Error(
        "Negative decimal value ${input} cannot be converted to u64."
      );
    }

    const shiftedValue = input.mul(new Decimal(10).pow(shift));
    const zeroDecimalValue = shiftedValue.trunc();
    return new u64(zeroDecimalValue.toString());
  }
}
