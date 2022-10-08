import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import { BN } from "bn.js";
import { assert } from "chai";

import type { CreatePartnerParams } from "../../src";
import { ClmmpoolContext, ClmmpoolIx } from "../../src";
import type { PartnerData } from "../../src/types";
import { confirmTx, loadProvider, parseMessage } from "../utils";
import {
  generateDefaultConfigParams,
  generateDefaultCreatePartnerParams,
} from "../utils/test-builders";

describe("update_partner", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  let partnerCreateInfo: CreatePartnerParams;
  let createdAuthority: anchor.web3.Keypair;
  it("successfully update a partner", async () => {
    // first create a partner
    const baseKeypair = anchor.web3.Keypair.generate();
    const authorityKeypair = anchor.web3.Keypair.generate();
    const claimAuthorityKeypair = anchor.web3.Keypair.generate();

    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);

    const partnerInitInfo = generateDefaultCreatePartnerParams(
      ctx,
      baseKeypair.publicKey,
      configInitInfo.clmmConfig,
      configInitInfo.protocolAuthority,
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
      [configKeypairs.protocolAuthorityKeypair, baseKeypair]
    );
    await confirmTx(tx);

    const createdPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(createdPartner.feeRate, partnerInitInfo.fee_rate);
    assert.ok(
      createdPartner.partnerFeeClaimAuthority.equals(
        partnerInitInfo.partner_fee_claim_authority
      )
    );

    partnerCreateInfo = partnerInitInfo;
    createdAuthority = authorityKeypair;
    // update partner with new fee rate and claim authority
    const newClaimAuthorityKeypair = anchor.web3.Keypair.generate();

    const updateTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.updatePartnerIx(ctx.program, {
          clmmConfig: configInitInfo.clmmConfig,
          partner: partnerInitInfo.partner,
          authority: partnerInitInfo.authority,
          new_fee_rate: 1107,
          new_claim_authority: newClaimAuthorityKeypair.publicKey,
        }),
      ],
      [authorityKeypair]
    );
    await confirmTx(updateTx);

    const updatedPartner = (await fetcher.getPartner(
      partnerInitInfo.partner
    )) as PartnerData;
    assert.equal(updatedPartner.feeRate, partnerInitInfo.fee_rate);
    assert.ok(
      updatedPartner.partnerFeeClaimAuthority.equals(
        partnerInitInfo.partner_fee_claim_authority
      )
    );
  });

  it("fails when new fee rate exceeds max", async () => {
    // update partner with new fee rate and claim authority
    const { configInitInfo } = generateDefaultConfigParams(ctx);
    const newClaimAuthorityKeypair = anchor.web3.Keypair.generate();

    const updateTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.updatePartnerIx(ctx.program, {
          clmmConfig: configInitInfo.clmmConfig,
          partner: partnerCreateInfo.partner,
          authority: partnerCreateInfo.authority,
          new_fee_rate: 2500 + 1,
          new_claim_authority: newClaimAuthorityKeypair.publicKey,
        }),
      ],
      [createdAuthority]
    );

    //AnchorError thrown in programs/clmmpool/src/state/partner.rs:66.
    //Error Code: InvalidTime. Error Number: 6038. Error Message: Invalid time.
    try {
      await confirmTx(updateTx);
    } catch (e) {
      assert.equal("6038", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails when authority is invalid", async () => {
    // update partner with new fee rate and claim authority
    const newClaimAuthorityKeypair = anchor.web3.Keypair.generate();
    const fakeAuthorityKeypair = anchor.web3.Keypair.generate();
    const { configInitInfo } = generateDefaultConfigParams(ctx);

    const updateTx = new TransactionEnvelope(
      provider,
      [
        ClmmpoolIx.updatePartnerIx(ctx.program, {
          clmmConfig: configInitInfo.clmmConfig,
          partner: partnerCreateInfo.partner,
          authority: fakeAuthorityKeypair.publicKey,
          new_fee_rate: 1107,
          new_claim_authority: newClaimAuthorityKeypair.publicKey,
        }),
      ],
      [fakeAuthorityKeypair]
    );

    //AnchorError caused by account: authority.
    //Error Code: InvalidAuthority. Error Number: 6022. Error Message: Invalid authority.
    try {
      await confirmTx(updateTx);
    } catch (e) {
      assert.equal("6022", parseMessage((e as Error).message.toString()));
    }
  });
});
