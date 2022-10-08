import Decimal from "decimal.js";

export * from "./clmmpool-client";
export * from "./context";
export * from "./ix";
export * from "./network";
export * from "./quotes";
export * from "./utils";
// export * from "./cli/utils";
export * from "./impl/clmmpool-client-impl";
export * from "./impl/clmmpool-impl";
export * from "./impl/position-impl";
export * from "./math/tick";
export * from "./quotes/index";
export * from "./utils/clmm";

// Global rules for Decimals
//  - 40 digits of precision for the largest number
//  - 20 digits of precision for the smallest number
//  - Always round towards 0 to mirror smart contract rules
Decimal.set({ precision: 40, toExpPos: 40, toExpNeg: -20, rounding: 1 });
