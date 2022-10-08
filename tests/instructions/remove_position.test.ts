import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import { getMintInfo, getTokenAccount } from "@saberhq/token-utils";
import { assert } from "chai";
import Decimal from "decimal.js";

import type { CreateClmmpoolParams } from "../../src";
import { ClmmpoolContext, ClmmpoolIx } from "../../src";
import { MathUtil } from "../../src/math/utils";
import {
  approveToken,
  confirmTx,
  createAndMintToTokenAccount,
  createTokenAccount,
  loadProvider,
  parseMessage,
  setAuthority,
  TickSpacing,
  transfer,
} from "../utils";
import { ClmmpoolTestFixture } from "../utils/fixture";
import {
  createTestPool,
  createTestPoolWithLiquidity,
  openTestPosition,
} from "../utils/init-utils";
import { ONE_SOL, ZERO_BN } from "../utils/test-consts";

describe("remove_position", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);

  const tickLowerIndex = 0;
  const tickUpperIndex = 128;
  let poolInfo: CreateClmmpoolParams;

  it("successfully remove position ", async () => {
    // create a test pool
    const price = MathUtil.toX64(new Decimal(10));
    const { poolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Standard,
      price
    );

    poolInfo = poolCreateInfo;

    const { params: positionOpenInfo } = await openTestPosition(
      ctx,
      poolInfo.clmmpool,
      tickLowerIndex,
      tickUpperIndex
    );

    const { position, positionNftMint } = positionOpenInfo;

    // remove an opened position
    const removePositionTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.removePositionIx(ctx.program, {
        owner: provider.wallet.publicKey,
        position,
        positionNftMint,
        positionAta: positionOpenInfo.positionAta,
        positionMetadataAccount: positionOpenInfo.positionMetadataAccount,
        positionEdition: positionOpenInfo.positionEdition,
      }),
    ]);

    await confirmTx(removePositionTx);

    const nftMintSupply = await getMintInfo(provider, positionNftMint);
    assert.equal(nftMintSupply.supply.toNumber(), 0);
    try {
      await getTokenAccount(provider, position);
    } catch (err) {
      assert.equal((err as Error).message, "Failed to find token account");
    }

    try {
      await getTokenAccount(provider, positionOpenInfo.positionAta);
    } catch (err) {
      assert.equal((err as Error).message, "Failed to find token account");
    }
  });

  it("succeeds when the token is delegated", async () => {
    // create a test pool
    const price = MathUtil.toX64(new Decimal(10));
    const { poolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Standard,
      price
    );

    poolInfo = poolCreateInfo;

    const owner = anchor.web3.Keypair.generate();
    const delegate = anchor.web3.Keypair.generate();

    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: owner.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const { params: positionOpenInfo } = await openTestPosition(
      ctx,
      poolCreateInfo.clmmpool,
      tickLowerIndex,
      tickUpperIndex,
      owner
    );

    const { position, positionNftMint } = positionOpenInfo;

    await approveToken(
      provider,
      positionOpenInfo.positionAta,
      delegate.publicKey,
      1,
      owner
    );
    await setAuthority(
      provider,
      positionOpenInfo.positionAta,
      delegate.publicKey,
      "CloseAccount",
      owner
    );

    // owner should set to delegate
    const removePositionTx = new TransactionEnvelope(
      ctx.provider,
      [
        ClmmpoolIx.removePositionIx(ctx.program, {
          owner: delegate.publicKey,
          position,
          positionNftMint,
          positionAta: positionOpenInfo.positionAta,
          positionMetadataAccount: positionOpenInfo.positionMetadataAccount,
          positionEdition: positionOpenInfo.positionEdition,
        }),
      ],
      [delegate]
    );

    await confirmTx(removePositionTx);
  });

  it("succeeds with position token that was transferred to new owner", async () => {
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [
        { tickLowerIndex: 0, tickUpperIndex: 256, liquidityAmount: ZERO_BN },
      ],
    });

    const position = fixture.getInfos().positions[0];

    const newOwner = anchor.web3.Keypair.generate();

    const newOwnerPositionTokenAccount = await createTokenAccount(
      provider,
      position!.nftMintKeypair.publicKey,
      newOwner.publicKey
    );

    await transfer(
      provider,
      position!.openPositionParams.positionAta,
      newOwnerPositionTokenAccount,
      1
    );

    // remove an opened position
    const removePositionTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.removePositionIx(ctx.program, {
        owner: newOwner.publicKey,
        position: position!.openPositionParams.position,
        positionNftMint: position!.nftMintKeypair.publicKey,
        positionAta: newOwnerPositionTokenAccount,
        positionMetadataAccount:
          position!.openPositionParams.positionMetadataAccount,
        positionEdition: position!.openPositionParams.positionEdition,
      }),
    ]);
    removePositionTx.addSigners(newOwner);

    await confirmTx(removePositionTx);
  });

  it("fails to close a position with liquidity", async () => {
    const { positionOpenInfo } = await createTestPoolWithLiquidity(ctx);

    // remove an opened position
    const removePositionTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.removePositionIx(ctx.program, {
        owner: provider.wallet.publicKey,
        position: positionOpenInfo.position,
        positionNftMint: positionOpenInfo.positionNftMint,
        positionAta: positionOpenInfo.positionAta,
        positionMetadataAccount: positionOpenInfo.positionMetadataAccount,
        positionEdition: positionOpenInfo.positionEdition,
      }),
    ]);

    try {
      await confirmTx(removePositionTx);
    } catch (e) {
      assert.equal("6014", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails if owner is not signer", async () => {
    const owner = anchor.web3.Keypair.generate();

    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: owner.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const { params: positionOpenInfo } = await openTestPosition(
      ctx,
      poolInfo.clmmpool,
      tickLowerIndex,
      tickUpperIndex,
      owner
    );

    // remove an opened position
    const removePositionTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.removePositionIx(ctx.program, {
        owner: owner.publicKey,
        position: positionOpenInfo.position,
        positionNftMint: positionOpenInfo.positionNftMint,
        positionAta: positionOpenInfo.positionAta,
        positionMetadataAccount: positionOpenInfo.positionMetadataAccount,
        positionEdition: positionOpenInfo.positionEdition,
      }),
    ]);

    try {
      await confirmTx(removePositionTx);
    } catch (e) {
      assert.equal(
        "Signature verification failed",
        (e as Error).message.toString()
      );
    }
  });

  it("fails when the token is delegated but not signer", async () => {
    const owner = anchor.web3.Keypair.generate();
    const delegate = anchor.web3.Keypair.generate();

    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: owner.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const { params: positionOpenInfo } = await openTestPosition(
      ctx,
      poolInfo.clmmpool,
      tickLowerIndex,
      tickUpperIndex,
      owner
    );

    const { position, positionNftMint } = positionOpenInfo;

    await approveToken(
      provider,
      positionOpenInfo.positionAta,
      delegate.publicKey,
      1,
      owner
    );
    await setAuthority(
      provider,
      positionOpenInfo.positionAta,
      delegate.publicKey,
      "CloseAccount",
      owner
    );

    // owner should set to delegate
    const removePositionTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.removePositionIx(ctx.program, {
        owner: delegate.publicKey,
        position,
        positionNftMint,
        positionAta: positionOpenInfo.positionAta,
        positionMetadataAccount: positionOpenInfo.positionMetadataAccount,
        positionEdition: positionOpenInfo.positionEdition,
      }),
    ]);

    try {
      await confirmTx(removePositionTx);
    } catch (e) {
      assert.equal(
        "Signature verification failed",
        (e as Error).message.toString()
      );
    }
  });

  it("fails if the authority does not match", async () => {
    const owner = anchor.web3.Keypair.generate();
    const fakeOwner = anchor.web3.Keypair.generate();

    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: owner.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const { params: positionOpenInfo } = await openTestPosition(
      ctx,
      poolInfo.clmmpool,
      tickLowerIndex,
      tickUpperIndex,
      owner
    );

    const { position, positionNftMint } = positionOpenInfo;

    // owner should set to delegate
    const removePositionTx = new TransactionEnvelope(
      ctx.provider,
      [
        ClmmpoolIx.removePositionIx(ctx.program, {
          owner: fakeOwner.publicKey,
          position,
          positionNftMint,
          positionAta: positionOpenInfo.positionAta,
          positionMetadataAccount: positionOpenInfo.positionMetadataAccount,
          positionEdition: positionOpenInfo.positionEdition,
        }),
      ],
      [fakeOwner]
    );

    try {
      await confirmTx(removePositionTx);
    } catch (e) {
      assert.equal("6017", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails if position token account does not contain exactly one token", async () => {
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [
        { tickLowerIndex: 0, tickUpperIndex: 256, liquidityAmount: ZERO_BN },
      ],
    });

    const position = fixture.getInfos().positions[0];

    const newOwner = anchor.web3.Keypair.generate();

    const newOwnerPositionTokenAccount = await createTokenAccount(
      provider,
      position!.nftMintKeypair.publicKey,
      newOwner.publicKey
    );

    // remove an opened position
    const removePositionTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.removePositionIx(ctx.program, {
        owner: newOwner.publicKey,
        position: position!.openPositionParams.position,
        positionNftMint: position!.nftMintKeypair.publicKey,
        positionAta: newOwnerPositionTokenAccount,
        positionMetadataAccount:
          position!.openPositionParams.positionMetadataAccount,
        positionEdition: position!.openPositionParams.positionEdition,
      }),
    ]);
    removePositionTx.addSigners(newOwner);

    try {
      await confirmTx(removePositionTx);
    } catch (e) {
      assert.equal("6024", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails if delegated amount is 0", async () => {
    const owner = anchor.web3.Keypair.generate();
    const delegate = anchor.web3.Keypair.generate();

    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: owner.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const { params: positionOpenInfo } = await openTestPosition(
      ctx,
      poolInfo.clmmpool,
      tickLowerIndex,
      tickUpperIndex,
      owner
    );

    const { position, positionNftMint } = positionOpenInfo;

    await approveToken(
      provider,
      positionOpenInfo.positionAta,
      delegate.publicKey,
      0,
      owner
    );
    await setAuthority(
      provider,
      positionOpenInfo.positionAta,
      delegate.publicKey,
      "CloseAccount",
      owner
    );

    // owner should set to delegate
    const removePositionTx = new TransactionEnvelope(
      ctx.provider,
      [
        ClmmpoolIx.removePositionIx(ctx.program, {
          owner: delegate.publicKey,
          position,
          positionNftMint,
          positionAta: positionOpenInfo.positionAta,
          positionMetadataAccount: positionOpenInfo.positionMetadataAccount,
          positionEdition: positionOpenInfo.positionEdition,
        }),
      ],
      [delegate]
    );

    try {
      await confirmTx(removePositionTx);
    } catch (e) {
      assert.equal(
        "ProgramFailedToComplete",
        (e as Error).message.substring(
          (e as Error).message.indexOf("[0,") + 4,
          (e as Error).message.indexOf("]}})") - 1
        )
      );
    }
  });

  it("fails if positionAuthority does not match delegate", async () => {
    const owner = anchor.web3.Keypair.generate();
    const delegate = anchor.web3.Keypair.generate();
    const fakeDelegate = anchor.web3.Keypair.generate();

    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: owner.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const { params: positionOpenInfo } = await openTestPosition(
      ctx,
      poolInfo.clmmpool,
      tickLowerIndex,
      tickUpperIndex,
      owner
    );

    const { position, positionNftMint } = positionOpenInfo;

    await approveToken(
      provider,
      positionOpenInfo.positionAta,
      delegate.publicKey,
      1,
      owner
    );
    await setAuthority(
      provider,
      positionOpenInfo.positionAta,
      delegate.publicKey,
      "CloseAccount",
      owner
    );

    // owner should set to delegate
    const removePositionTx = new TransactionEnvelope(
      ctx.provider,
      [
        ClmmpoolIx.removePositionIx(ctx.program, {
          owner: fakeDelegate.publicKey,
          position,
          positionNftMint,
          positionAta: positionOpenInfo.positionAta,
          positionMetadataAccount: positionOpenInfo.positionMetadataAccount,
          positionEdition: positionOpenInfo.positionEdition,
        }),
      ],
      [fakeDelegate]
    );

    // Error Code: InvalidTokenAccountOwner.
    // Error Number: 6017. Error Message: Invalid Token account owner.
    try {
      await confirmTx(removePositionTx);
    } catch (e) {
      assert.equal("6017", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails if position token account mint does not match position mint", async () => {
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [
        { tickLowerIndex: 0, tickUpperIndex: 256, liquidityAmount: ZERO_BN },
      ],
    });

    const position = fixture.getInfos().positions[0];

    const fakePositionTokenAccount = await createAndMintToTokenAccount(
      provider,
      poolInfo.tokenA,
      1
    );

    // remove an opened position
    const removePositionTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.removePositionIx(ctx.program, {
        owner: provider.wallet.publicKey,
        position: position!.openPositionParams.position,
        positionNftMint: position!.nftMintKeypair.publicKey,
        positionAta: fakePositionTokenAccount,
        positionMetadataAccount:
          position!.openPositionParams.positionMetadataAccount,
        positionEdition: position!.openPositionParams.positionEdition,
      }),
    ]);

    try {
      await confirmTx(removePositionTx);
    } catch (e) {
      assert.equal("6024", parseMessage((e as Error).message.toString()));
    }
  });

  it("fails if position_mint does not match position's position_mint field", async () => {
    const fixture = await new ClmmpoolTestFixture(ctx).init({
      tickSpacing: TickSpacing.Standard,
      positions: [
        { tickLowerIndex: 0, tickUpperIndex: 256, liquidityAmount: ZERO_BN },
      ],
    });

    const position = fixture.getInfos().positions[0];

    // remove an opened position
    const removePositionTx = new TransactionEnvelope(ctx.provider, [
      ClmmpoolIx.removePositionIx(ctx.program, {
        owner: provider.wallet.publicKey,
        position: position!.openPositionParams.position,
        positionNftMint: poolInfo.tokenA,
        positionAta: position!.openPositionParams.positionAta,
        positionMetadataAccount:
          position!.openPositionParams.positionMetadataAccount,
        positionEdition: position!.openPositionParams.positionEdition,
      }),
    ]);

    // AnchorError caused by account: position_nft_mint.
    // Error Code: InvalidMint. Error Number: 6021. Error Message: Invalid mint.
    try {
      await confirmTx(removePositionTx);
    } catch (e) {
      assert.equal("6021", parseMessage((e as Error).message.toString()));
    }
  });
});
