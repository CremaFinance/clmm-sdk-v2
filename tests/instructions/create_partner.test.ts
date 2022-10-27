import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import { BN } from "bn.js";
import { assert } from "chai";

import type { InitClmmConfigParams } from "../../src";
import { ClmmpoolContext, ClmmpoolIx } from "../../src";
import type { PartnerData } from "../../src/types";
import { confirmTx, loadProvider, parseMessage } from "../utils";
import type { TestClmmpoolsConfigKeypairs } from "../utils/test-builders";
import {
  generateDefaultConfigParams,
  generateDefaultCreatePartnerParams,
} from "../utils/test-builders";
import { ONE_SOL } from "../utils/test-consts";

describe("create_partner", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  let configInfo: InitClmmConfigParams;
  let conKeypairs: TestClmmpoolsConfigKeypairs;

  it("successfully create a partner", async () => {
    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);

    (configInfo = configInitInfo), (conKeypairs = configKeypairs);

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configInfo.clmmConfig,
      configInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(9920211107),
      new BN(9920220117),
      "test"
    );

    const tx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [conKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(tx);

    // update partner with new fee rate and claim authority
    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);
    assert.ok(
      createdPartner.partnerFeeClaimAuthority.equals(
        partnerInitInfo.partner_fee_claim_authority
      )
    );
  });

  it("succeeds when funder is different than account paying for transaction fee", async () => {
    const payerKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();
    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: payerKeypair.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const baseKeypair = anchor.web3.Keypair.generate();
    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configInfo.clmmConfig,
      configInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(9920211107),
      new BN(9920220117),
      "test",
      payerKeypair.publicKey
    );

    const tx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [payerKeypair, conKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(tx);

    // update partner with new fee rate and claim authority
    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);
    assert.ok(
      createdPartner.partnerFeeClaimAuthority.equals(
        partnerInitInfo.partner_fee_claim_authority
      )
    );
  });

  it("failed when create with a invalid name", async () => {
    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();
    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configInfo.clmmConfig,
      configInfo.protocolAuthority,
      authorityKeypair.publicKey,
      claimAuthorityKeypair.publicKey,
      256,
      new BN(9920211107),
      new BN(9920220117),
      "test_partner"
    );

    const tx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.createPartnerIx(ctx.program, {
          ...partnerInitInfo,
        }),
      ],
      [baseKeypair, conKeypairs.protocolAuthorityKeypair]
    );

    try {
      await confirmTx(tx);
    } catch (e) {
      assert.equal("1106", parseMessage((e as Error).message.toString()));
    }
  });
});
