import { TICK_ARRAY_SIZE } from "../../types/constants";
import { TickUtil } from "../../utils";

export class TickArrayIndex {
  static fromTickIndex(index: number, tickSpacing: number): TickArrayIndex {
    const arrayIndex = TickUtil.getArrayIndex(index, tickSpacing);
    let offsetIndex = TickUtil.getOffset(index, tickSpacing);
    if (offsetIndex < 0) {
      offsetIndex = TICK_ARRAY_SIZE + offsetIndex;
    }
    return new TickArrayIndex(arrayIndex, offsetIndex, tickSpacing);
  }

  constructor(
    readonly arrayIndex: number,
    readonly offsetIndex: number,
    readonly tickSpacing: number
  ) {
    if (offsetIndex >= TICK_ARRAY_SIZE) {
      throw new Error(
        "Invalid offsetIndex - value has to be smaller than TICK_ARRAY_SIZE"
      );
    }
    if (offsetIndex < 0) {
      throw new Error("Invalid offsetIndex - value is smaller than 0");
    }

    if (tickSpacing < 0) {
      throw new Error("Invalid tickSpacing - value is less than 0");
    }
  }

  toTickIndex(): number {
    return (
      this.arrayIndex * TICK_ARRAY_SIZE * this.tickSpacing +
      this.offsetIndex * this.tickSpacing
    );
  }

  toNextInitializableTickIndex(): TickArrayIndex {
    return TickArrayIndex.fromTickIndex(
      this.toTickIndex() + this.tickSpacing,
      this.tickSpacing
    );
  }

  toPrevInitializableTickIndex(): TickArrayIndex {
    return TickArrayIndex.fromTickIndex(
      this.toTickIndex() - this.tickSpacing,
      this.tickSpacing
    );
  }
}
