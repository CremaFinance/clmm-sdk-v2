import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import * as anchor from "@project-serum/anchor";
import { TransactionEnvelope } from "@cremafinance/solana-contrib";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { assert } from "chai";
import Decimal from "../../src/utils/decimal";

import type { CreateClmmpoolParams } from "../../src";
import { ClmmpoolContext, ClmmpoolIx } from "../../src";
import { MathUtil } from "../../src/math/utils";
import type { PositionData } from "../../src/types";
import { MAX_TICK_INDEX, MIN_TICK_INDEX } from "../../src/types";
import {
  confirmTx,
  createMint,
  loadProvider,
  mintToByAuthority,
  parseMessage,
  TickSpacing,
} from "../utils";
import { createTestPool, openTestPosition } from "../utils/init-utils";
import { generateDefaultOpenPositionParams } from "../utils/test-builders";
import { ONE_SOL, ZERO_BN } from "../utils/test-consts";

describe("open_position", () => {
  const provider = loadProvider();
  const program = anchor.workspace.Clmmpool;
  const ctx = ClmmpoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  const tickLowerIndex = 0;
  const tickUpperIndex = 128;

  let poolInfo: CreateClmmpoolParams;

  async function checkMetadata(
    metadataPdaAddress: PublicKey,
    positionNftMint: PublicKey
  ) {
    assert.ok(metadataPdaAddress !== null);
    const metadata = await Metadata.load(
      provider.connection,
      metadataPdaAddress
    );
    assert.ok(
      metadata.data.updateAuthority ===
        "5QW9BCx6oZKjSWCVyBZaVU8N4jwtFnged9TsiaXvDj8Q"
    );
    assert.ok(metadata.data.mint === positionNftMint.toString());
  }

  it("successfully open position and verify position address contents", async () => {
    // create a test pool
    const price = MathUtil.toX64(new Decimal(10));
    const { poolCreateInfo } = await createTestPool(
      ctx,
      TickSpacing.Standard,
      price
    );

    const payerKeypair = anchor.web3.Keypair.generate();
    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: payerKeypair.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    poolInfo = poolCreateInfo;

    const { params: positionOpenInfo, nftMint } = await openTestPosition(
      ctx,
      poolCreateInfo.clmmpool,
      tickLowerIndex,
      tickUpperIndex
    );

    const { position, positionNftMint } = positionOpenInfo;
    const openedPosition = (await fetcher.getPosition(
      position
    )) as PositionData;

    assert.strictEqual(openedPosition.tickLowerIndex, tickLowerIndex);
    assert.strictEqual(openedPosition.tickUpperIndex, tickUpperIndex);
    assert.ok(openedPosition.clmmpool.equals(positionOpenInfo.clmmpool));
    assert.ok(openedPosition.positionNftMint.equals(positionNftMint));
    assert.ok(openedPosition.liquidity.eq(ZERO_BN));
    assert.ok(openedPosition.feeGrowthInsideA.eq(ZERO_BN));
    assert.ok(openedPosition.feeGrowthInsideB.eq(ZERO_BN));
    assert.ok(openedPosition.feeOwedA.eq(ZERO_BN));
    assert.ok(openedPosition.feeOwedB.eq(ZERO_BN));
    assert.ok(openedPosition.positionNftMint.equals(nftMint.publicKey));
    await checkMetadata(
      positionOpenInfo.positionMetadataAccount,
      positionNftMint
    );
  });

  it("open position & verify position mint behavior", async () => {
    const newOwner = Keypair.generate();

    const systemTransferTx = new TransactionEnvelope(provider, [
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: newOwner.publicKey,
        lamports: ONE_SOL,
      }),
    ]);
    await confirmTx(systemTransferTx);

    const { params, nftMint } = await openTestPosition(
      ctx,
      poolInfo.clmmpool,
      tickLowerIndex,
      tickUpperIndex,
      newOwner
    );

    await checkMetadata(params.positionMetadataAccount, nftMint.publicKey);

    const token = new Token(
      ctx.connection,
      nftMint.publicKey,
      TOKEN_PROGRAM_ID,
      Keypair.generate()
    );

    const userTokenAccount = await token.getAccountInfo(params.positionAta);
    assert.ok(userTokenAccount.amount.eq(new anchor.BN(1)));
    assert.ok(userTokenAccount.owner.equals(newOwner.publicKey));

    //Error: the total supply of this token is fixed
    try {
      await mintToByAuthority(
        provider,
        nftMint.publicKey,
        params.positionAta,
        1
      );
    } catch (e) {
      assert.equal("5", parseMessage((e as Error).message.toString()));
    }
  });

  it("user must pass the valid token ATA account", async () => {
    const anotherMintKey = await createMint(
      provider,
      provider.wallet.publicKey
    );
    const positionTokenAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      anotherMintKey,
      ctx.provider.wallet.publicKey
    );

    const { params, nftMint } = await generateDefaultOpenPositionParams(
      ctx,
      poolInfo.clmmpool,
      tickLowerIndex,
      tickUpperIndex
    );

    const openPositionTx = new TransactionEnvelope(
      ctx.provider,
      [
        ClmmpoolIx.openPositionIx(ctx.program, {
          ...params,
          positionAta: positionTokenAccountAddress,
        }),
      ],
      [nftMint]
    );

    //Error: the total supply of this token is fixed
    try {
      await confirmTx(openPositionTx);
    } catch (e) {
      assert.equal(
        "MissingAccount",
        (e as Error).message.substring(
          (e as Error).message.indexOf("[0,") + 4,
          (e as Error).message.indexOf("]}})") - 1
        )
      );
    }
  });

  describe("invalid ticks", () => {
    async function assertTickFail(lowerTick: number, upperTick: number) {
      // AnchorError thrown in programs/clmmpool/src/state/tick.rs:49.
      // Error Code: InvalidTickIndex. Error Number: 6014. Error Message: Invalid tick index.
      try {
        await openTestPosition(ctx, poolInfo.clmmpool, lowerTick, upperTick);
      } catch (e) {
        assert.equal("6014", parseMessage((e as Error).message.toString()));
      }
    }

    it("fail when user pass in an out of bound tick index for upper-index", async () => {
      await assertTickFail(0, MAX_TICK_INDEX + 1);
    });

    it("fail when user pass in a lower tick index that is higher than the upper-index", async () => {
      await assertTickFail(-22534, -22534 - 1);
    });

    it("fail when user pass in a lower tick index that equals the upper-index", async () => {
      await assertTickFail(22365, 22365);
    });

    it("fail when user pass in an out of bound tick index for lower-index", async () => {
      await assertTickFail(MIN_TICK_INDEX - 1, 0);
    });

    it("fail when user pass in a non-initializable tick index for upper-index", async () => {
      await assertTickFail(0, 1);
    });

    it("fail when user pass in a non-initializable tick index for lower-index", async () => {
      await assertTickFail(1, 2);
    });
  });
});
