import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import assert from "assert";

import type { InitClmmConfigParams } from "../../src";
import { ClmmpoolContext, ClmmpoolIx } from "../../src";
import type { ClmmConfigData } from "../../src/types";
import { confirmTx, loadProvider } from "../utils";
import { generateDefaultConfigParams } from "../utils/test-builders";
import { parseMessage } from "../utils/utils";

describe("create_clmm_config", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  let initClmmConfigInfo: InitClmmConfigParams;

  // it only test once before all tests
  // so it will return 0 error: account Address { address: xxxxxx, base: None } already in use
  it("successfully init a ClmmpoolsConfig account", async () => {
    const { configInitInfo } = generateDefaultConfigParams(ctx);

    const tx = new TransactionEnvelope(provider, [
      ClmmpoolIx.createClmmConfigIx(ctx.program, {
        ...configInitInfo,
      }),
    ]);

    await confirmTx(tx);

    const configAccount = (await fetcher.getConfig(
      configInitInfo.clmmConfig
    )) as ClmmConfigData;

    assert.ok(
      configAccount.protocolAuthority.equals(configInitInfo.protocolAuthority)
    );

    assert.ok(
      configAccount.protocolFeeClaimAuthority.equals(
        configInitInfo.protocolFeeClaimAuthority
      )
    );

    assert.equal(configAccount.protocolFeeRate, configInitInfo.protocolFeeRate);

    initClmmConfigInfo = configInitInfo;
  });

  it("fail on passing in already created clmmpool account", async () => {
    const infoWithDupeConfigKey = {
      ...generateDefaultConfigParams(ctx).configInitInfo,
      clmmConfigKeypair: initClmmConfigInfo!.clmmConfig,
    };
    const tx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.createClmmConfigIx(ctx.program, {
        ...infoWithDupeConfigKey,
      }),
    ]);

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("0", parseMessage((e as Error).message.toString()));
    }
  });
});
