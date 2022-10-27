export type clmmpool = {
  "version": "0.1.0",
  "name": "clmmpool",
  "instructions": [
    {
      "name": "initializeClmmConfig",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "protocolAuthority",
          "type": "publicKey"
        },
        {
          "name": "protocolFeeClaimAuthority",
          "type": "publicKey"
        },
        {
          "name": "createPoolAuthority",
          "type": "publicKey"
        },
        {
          "name": "protocolFeeRate",
          "type": "u16"
        }
      ]
    },
    {
      "name": "createFeeTier",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeTier",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tickSpacing",
          "type": "u16"
        },
        {
          "name": "feeRate",
          "type": "u16"
        }
      ]
    },
    {
      "name": "updateConfig",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newProtocolFeeRate",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "createPoolAuthority",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "claimAuthority",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "updateFeeRate",
      "accounts": [
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newFeeRate",
          "type": "u16"
        }
      ]
    },
    {
      "name": "transferProtocolAuthority",
      "accounts": [
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newAuthority",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "acceptProtocolAuthority",
      "accounts": [
        {
          "name": "newAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createClmmpool",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeTier",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "initSqrtPrice",
          "type": "u128"
        }
      ]
    },
    {
      "name": "createTickArray",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tickArray",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "arrayIndex",
          "type": "u16"
        }
      ]
    },
    {
      "name": "createTickArrayMap",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "openPosition",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionNftMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionMetadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tickLowerIndex",
          "type": "i32"
        },
        {
          "name": "tickUpperIndex",
          "type": "i32"
        }
      ]
    },
    {
      "name": "removePosition",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionNftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionMetadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "increaseLiquidity",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "deltaLiquidity",
          "type": "u128"
        },
        {
          "name": "tokenAMax",
          "type": "u64"
        },
        {
          "name": "tokenBMax",
          "type": "u64"
        }
      ]
    },
    {
      "name": "increaseLiquidityWithFixedToken",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenA",
          "type": "u64"
        },
        {
          "name": "tokenB",
          "type": "u64"
        },
        {
          "name": "isAFixed",
          "type": "bool"
        }
      ]
    },
    {
      "name": "decreaseLiquidity",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "deltaLiquidity",
          "type": "u128"
        },
        {
          "name": "tokenAMin",
          "type": "u64"
        },
        {
          "name": "tokenBMin",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "aToB",
          "type": "bool"
        },
        {
          "name": "byAmountIn",
          "type": "bool"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "amountLimit",
          "type": "u64"
        },
        {
          "name": "sqrtPriceLimit",
          "type": "u128"
        }
      ]
    },
    {
      "name": "collectFee",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayLower",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tickArrayUpper",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "collectProtocolFee",
      "accounts": [
        {
          "name": "protocolFeeClaimAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createPartner",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "partner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "partnerFeeClaimAuthority",
          "type": "publicKey"
        },
        {
          "name": "feeRate",
          "type": "u16"
        },
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "endTime",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "updatePartner",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "partner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newFeeRate",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "newClaimAuthority",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "startTime",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "endTime",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "collectPartnerFee",
      "accounts": [
        {
          "name": "partnerFeeClaimAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "partner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAPartnerFeeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBPartnerFeeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "swapWithPartner",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "partner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "partnerAtaA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "partnerAtaB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "aToB",
          "type": "bool"
        },
        {
          "name": "byAmountIn",
          "type": "bool"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "amountLimit",
          "type": "u64"
        },
        {
          "name": "sqrtPriceLimit",
          "type": "u128"
        }
      ]
    },
    {
      "name": "initializeRewarder",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewarderAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "rewarderTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "rewarderIndex",
          "type": "u8"
        },
        {
          "name": "mintWrapper",
          "type": "publicKey"
        },
        {
          "name": "minter",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateRewarderEmission",
      "accounts": [
        {
          "name": "rewarderAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "rewarderIndex",
          "type": "u8"
        },
        {
          "name": "emissionsPerSecond",
          "type": "u128"
        }
      ]
    },
    {
      "name": "collectRewarder",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewarderAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintWrapperProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewardsTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayLower",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tickArrayUpper",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "rewarderIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "transferPartnerClaimAuthority",
      "accounts": [
        {
          "name": "partnerClaimAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "partner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newAuthority",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "acceptPartnerClaimAuthority",
      "accounts": [
        {
          "name": "newAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "partner",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "pauseClmmpool",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "unpauseClmmpool",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createClmmpoolMetadata",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpoolMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "clmmConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "protocolAuthority",
            "type": "publicKey"
          },
          {
            "name": "protocolFeeClaimAuthority",
            "type": "publicKey"
          },
          {
            "name": "protocolFeeRate",
            "type": "u16"
          },
          {
            "name": "pendingAuthority",
            "type": "publicKey"
          },
          {
            "name": "createPoolAuthority",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "clmmpoolMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "clmmpool",
            "type": "publicKey"
          },
          {
            "name": "positionNums",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "clmmpool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "clmmConfig",
            "type": "publicKey"
          },
          {
            "name": "tokenA",
            "type": "publicKey"
          },
          {
            "name": "tokenB",
            "type": "publicKey"
          },
          {
            "name": "tokenAVault",
            "type": "publicKey"
          },
          {
            "name": "tokenBVault",
            "type": "publicKey"
          },
          {
            "name": "tickSpacing",
            "type": "u16"
          },
          {
            "name": "tickSpacingSeed",
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "feeRate",
            "type": "u16"
          },
          {
            "name": "liquidity",
            "type": "u128"
          },
          {
            "name": "currentSqrtPrice",
            "type": "u128"
          },
          {
            "name": "currentTickIndex",
            "type": "i32"
          },
          {
            "name": "feeGrowthGlobalA",
            "type": "u128"
          },
          {
            "name": "feeGrowthGlobalB",
            "type": "u128"
          },
          {
            "name": "feeProtocolTokenA",
            "type": "u64"
          },
          {
            "name": "feeProtocolTokenB",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "rewarderInfos",
            "type": {
              "array": [
                {
                  "defined": "Rewarder"
                },
                3
              ]
            }
          },
          {
            "name": "rewarderLastUpdatedTime",
            "type": "u64"
          },
          {
            "name": "isPause",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "feeTier",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeRate",
            "type": "u16"
          },
          {
            "name": "tickSpacing",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "partner",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "partnerFeeClaimAuthority",
            "type": "publicKey"
          },
          {
            "name": "pendingAuthority",
            "type": "publicKey"
          },
          {
            "name": "base",
            "type": "publicKey"
          },
          {
            "name": "feeRate",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "startTime",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "clmmpool",
            "type": "publicKey"
          },
          {
            "name": "positionNftMint",
            "type": "publicKey"
          },
          {
            "name": "liquidity",
            "type": "u128"
          },
          {
            "name": "tickLowerIndex",
            "type": "i32"
          },
          {
            "name": "tickUpperIndex",
            "type": "i32"
          },
          {
            "name": "feeGrowthInsideA",
            "type": "u128"
          },
          {
            "name": "feeOwedA",
            "type": "u64"
          },
          {
            "name": "feeGrowthInsideB",
            "type": "u128"
          },
          {
            "name": "feeOwedB",
            "type": "u64"
          },
          {
            "name": "rewarderInfos",
            "type": {
              "array": [
                {
                  "defined": "PositionReward"
                },
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "tickArray",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "arrayIndex",
            "type": "u16"
          },
          {
            "name": "tickSpacing",
            "type": "u16"
          },
          {
            "name": "clmmpool",
            "type": "publicKey"
          },
          {
            "name": "ticks",
            "type": {
              "array": [
                {
                  "defined": "Tick"
                },
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "tickArrayMap",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bitmap",
            "type": {
              "array": [
                "u8",
                868
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Rewarder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintWrapper",
            "type": "publicKey"
          },
          {
            "name": "minter",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "emissionsPerSecond",
            "type": "u128"
          },
          {
            "name": "growthGlobal",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "PositionReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "growthInside",
            "type": "u128"
          },
          {
            "name": "amountOwed",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Tick",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "i32"
          },
          {
            "name": "sqrtPrice",
            "type": "u128"
          },
          {
            "name": "liquidityNet",
            "type": "i128"
          },
          {
            "name": "liquidityGross",
            "type": "u128"
          },
          {
            "name": "feeGrowthOutsideA",
            "type": "u128"
          },
          {
            "name": "feeGrowthOutsideB",
            "type": "u128"
          },
          {
            "name": "rewardGrowthOutside",
            "type": {
              "array": [
                "u128",
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "LOK"
          },
          {
            "name": "NumberCastError"
          },
          {
            "name": "ZeroMintAmount"
          },
          {
            "name": "IntegerDowncastOverflow"
          },
          {
            "name": "MultiplicationOverflow"
          },
          {
            "name": "DivisorIsZero"
          },
          {
            "name": "TokenAmountMinSubceeded"
          },
          {
            "name": "TokenAmountMaxExceeded"
          },
          {
            "name": "SqrtPriceOutOfBounds"
          },
          {
            "name": "ProtocolFeeRateIllegal"
          },
          {
            "name": "FeeRateIllegal"
          },
          {
            "name": "TokenMintPairIllgal"
          },
          {
            "name": "TickArrayStartIndexIllegal"
          },
          {
            "name": "InvalidTickSpacing"
          },
          {
            "name": "InvalidTickIndex"
          },
          {
            "name": "InvalidTickArrayAccount"
          },
          {
            "name": "PositionIsNotEmpty"
          },
          {
            "name": "InvalidTokenAccountOwner"
          },
          {
            "name": "TickNotFound"
          },
          {
            "name": "TickNotInArray"
          },
          {
            "name": "InvalidTokenAccount"
          },
          {
            "name": "InvalidMint"
          },
          {
            "name": "InvalidAuthority"
          },
          {
            "name": "PositionAndClmmpoolNotMatch"
          },
          {
            "name": "PositionIllegal"
          },
          {
            "name": "InvalidDeltaLiquidity"
          },
          {
            "name": "ConfigAndPoolNotMatch"
          },
          {
            "name": "WrongSqrtPriceLimit"
          },
          {
            "name": "TickArrayNotFound"
          },
          {
            "name": "InvalidTickArrayIndex"
          },
          {
            "name": "NextTickNotFound"
          },
          {
            "name": "FeeGrowthIllegal"
          },
          {
            "name": "LiquidityOverflow"
          },
          {
            "name": "LiquidityUnderflow"
          },
          {
            "name": "RemainerAmountUnderflow"
          },
          {
            "name": "SwapAmountInOverflow"
          },
          {
            "name": "SwapAmountOutOverflow"
          },
          {
            "name": "SwapFeeAmountOverflow"
          },
          {
            "name": "InvalidTime"
          },
          {
            "name": "AmountInAboveMaximumLimit"
          },
          {
            "name": "AmountOutBelowMaximumLimit"
          },
          {
            "name": "InvalidFixedTokenType"
          },
          {
            "name": "InvalidRewarderIndex"
          },
          {
            "name": "InvalidPartner"
          },
          {
            "name": "InvalidClmmpoolStatus"
          },
          {
            "name": "InvalidClmmpoolMetadataAccount"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "AcceptPartnerClaimAuthorityEvent",
      "fields": [
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "AcceptProtocolAuthorityEvent",
      "fields": [
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CollectFeeEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CollectPartnerFeeEvent",
      "fields": [
        {
          "name": "claimAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CollectProtocolFeeEvent",
      "fields": [
        {
          "name": "claimAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CollectRewarderEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "rewarderMint",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreateClmmPoolEvent",
      "fields": [
        {
          "name": "payer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "feeTier",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenA",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenB",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreateClmmpoolMetadataEvent",
      "fields": [
        {
          "name": "clmmpool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "clmmpoolMetadata",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreateFeeTierEvent",
      "fields": [
        {
          "name": "payer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "feeTier",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreatePartnerEvent",
      "fields": [
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "protocolAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreateTickArrayEvent",
      "fields": [
        {
          "name": "payer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tickArray",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "arrayIndex",
          "type": "u16",
          "index": false
        }
      ]
    },
    {
      "name": "CreateTickArrayMapEvent",
      "fields": [
        {
          "name": "payer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tickArrayMap",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "DecreaseLiquidityEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "deltaLiquidity",
          "type": "u128",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "IncreaseLiquidityEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "deltaLiquidity",
          "type": "u128",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "IncreaseLiquidityWithFixedTokenEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "deltaLiquidity",
          "type": "u128",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "InitializeClmmConfigEvent",
      "fields": [
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "feeAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "claimAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "createPoolAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "feeRate",
          "type": "u16",
          "index": false
        }
      ]
    },
    {
      "name": "OpenPositionEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "position",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tickLowerIndex",
          "type": "i32",
          "index": false
        },
        {
          "name": "tickUpperIndex",
          "type": "i32",
          "index": false
        }
      ]
    },
    {
      "name": "RemovePositionEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "position",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "SwapEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "aToB",
          "type": "bool",
          "index": false
        },
        {
          "name": "amountIn",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountOut",
          "type": "u64",
          "index": false
        },
        {
          "name": "refAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "feeAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "protocolAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "vaultAAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "vaultBAmount",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "SwapWithPartnerEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "aToB",
          "type": "bool",
          "index": false
        },
        {
          "name": "amountIn",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountOut",
          "type": "u64",
          "index": false
        },
        {
          "name": "refAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "feeAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "protocolAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "vaultAAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "vaultBAmount",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "TransferPartnerClaimAuthorityEvent",
      "fields": [
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "TransferProtocolAuthorityEvent",
      "fields": [
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "UpdateConfigEvent",
      "fields": [
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newProtocolFeeRate",
          "type": {
            "option": "u16"
          },
          "index": false
        },
        {
          "name": "createPoolAuthority",
          "type": {
            "option": "publicKey"
          },
          "index": false
        },
        {
          "name": "claimAuthority",
          "type": {
            "option": "publicKey"
          },
          "index": false
        }
      ]
    },
    {
      "name": "UpdateFeeRateEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "UpdatePartnerEvent",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newFeeRate",
          "type": {
            "option": "u16"
          },
          "index": false
        },
        {
          "name": "newClaimAuthority",
          "type": {
            "option": "publicKey"
          },
          "index": false
        }
      ]
    }
  ]
};

export const IDL: clmmpool = {
  "version": "0.1.0",
  "name": "clmmpool",
  "instructions": [
    {
      "name": "initializeClmmConfig",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "protocolAuthority",
          "type": "publicKey"
        },
        {
          "name": "protocolFeeClaimAuthority",
          "type": "publicKey"
        },
        {
          "name": "createPoolAuthority",
          "type": "publicKey"
        },
        {
          "name": "protocolFeeRate",
          "type": "u16"
        }
      ]
    },
    {
      "name": "createFeeTier",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeTier",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tickSpacing",
          "type": "u16"
        },
        {
          "name": "feeRate",
          "type": "u16"
        }
      ]
    },
    {
      "name": "updateConfig",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newProtocolFeeRate",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "createPoolAuthority",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "claimAuthority",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "updateFeeRate",
      "accounts": [
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newFeeRate",
          "type": "u16"
        }
      ]
    },
    {
      "name": "transferProtocolAuthority",
      "accounts": [
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newAuthority",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "acceptProtocolAuthority",
      "accounts": [
        {
          "name": "newAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createClmmpool",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeTier",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "initSqrtPrice",
          "type": "u128"
        }
      ]
    },
    {
      "name": "createTickArray",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tickArray",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "arrayIndex",
          "type": "u16"
        }
      ]
    },
    {
      "name": "createTickArrayMap",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "openPosition",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionNftMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionMetadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tickLowerIndex",
          "type": "i32"
        },
        {
          "name": "tickUpperIndex",
          "type": "i32"
        }
      ]
    },
    {
      "name": "removePosition",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionNftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionMetadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "increaseLiquidity",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "deltaLiquidity",
          "type": "u128"
        },
        {
          "name": "tokenAMax",
          "type": "u64"
        },
        {
          "name": "tokenBMax",
          "type": "u64"
        }
      ]
    },
    {
      "name": "increaseLiquidityWithFixedToken",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenA",
          "type": "u64"
        },
        {
          "name": "tokenB",
          "type": "u64"
        },
        {
          "name": "isAFixed",
          "type": "bool"
        }
      ]
    },
    {
      "name": "decreaseLiquidity",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "deltaLiquidity",
          "type": "u128"
        },
        {
          "name": "tokenAMin",
          "type": "u64"
        },
        {
          "name": "tokenBMin",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "aToB",
          "type": "bool"
        },
        {
          "name": "byAmountIn",
          "type": "bool"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "amountLimit",
          "type": "u64"
        },
        {
          "name": "sqrtPriceLimit",
          "type": "u128"
        }
      ]
    },
    {
      "name": "collectFee",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayLower",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tickArrayUpper",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "collectProtocolFee",
      "accounts": [
        {
          "name": "protocolFeeClaimAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createPartner",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "partner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "partnerFeeClaimAuthority",
          "type": "publicKey"
        },
        {
          "name": "feeRate",
          "type": "u16"
        },
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "endTime",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "updatePartner",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "partner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newFeeRate",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "newClaimAuthority",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "startTime",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "endTime",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "collectPartnerFee",
      "accounts": [
        {
          "name": "partnerFeeClaimAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "partner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAPartnerFeeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBPartnerFeeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "swapWithPartner",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayMap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "partner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "partnerAtaA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "partnerAtaB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "aToB",
          "type": "bool"
        },
        {
          "name": "byAmountIn",
          "type": "bool"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "amountLimit",
          "type": "u64"
        },
        {
          "name": "sqrtPriceLimit",
          "type": "u128"
        }
      ]
    },
    {
      "name": "initializeRewarder",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewarderAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "rewarderTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "rewarderIndex",
          "type": "u8"
        },
        {
          "name": "mintWrapper",
          "type": "publicKey"
        },
        {
          "name": "minter",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateRewarderEmission",
      "accounts": [
        {
          "name": "rewarderAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "rewarderIndex",
          "type": "u8"
        },
        {
          "name": "emissionsPerSecond",
          "type": "u128"
        }
      ]
    },
    {
      "name": "collectRewarder",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewarderAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintWrapperProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewardsTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickArrayLower",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tickArrayUpper",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "rewarderIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "transferPartnerClaimAuthority",
      "accounts": [
        {
          "name": "partnerClaimAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "partner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newAuthority",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "acceptPartnerClaimAuthority",
      "accounts": [
        {
          "name": "newAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "partner",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "pauseClmmpool",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "unpauseClmmpool",
      "accounts": [
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clmmpool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createClmmpoolMetadata",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clmmConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clmmpoolMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "clmmConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "protocolAuthority",
            "type": "publicKey"
          },
          {
            "name": "protocolFeeClaimAuthority",
            "type": "publicKey"
          },
          {
            "name": "protocolFeeRate",
            "type": "u16"
          },
          {
            "name": "pendingAuthority",
            "type": "publicKey"
          },
          {
            "name": "createPoolAuthority",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "clmmpoolMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "clmmpool",
            "type": "publicKey"
          },
          {
            "name": "positionNums",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "clmmpool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "clmmConfig",
            "type": "publicKey"
          },
          {
            "name": "tokenA",
            "type": "publicKey"
          },
          {
            "name": "tokenB",
            "type": "publicKey"
          },
          {
            "name": "tokenAVault",
            "type": "publicKey"
          },
          {
            "name": "tokenBVault",
            "type": "publicKey"
          },
          {
            "name": "tickSpacing",
            "type": "u16"
          },
          {
            "name": "tickSpacingSeed",
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "feeRate",
            "type": "u16"
          },
          {
            "name": "liquidity",
            "type": "u128"
          },
          {
            "name": "currentSqrtPrice",
            "type": "u128"
          },
          {
            "name": "currentTickIndex",
            "type": "i32"
          },
          {
            "name": "feeGrowthGlobalA",
            "type": "u128"
          },
          {
            "name": "feeGrowthGlobalB",
            "type": "u128"
          },
          {
            "name": "feeProtocolTokenA",
            "type": "u64"
          },
          {
            "name": "feeProtocolTokenB",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "rewarderInfos",
            "type": {
              "array": [
                {
                  "defined": "Rewarder"
                },
                3
              ]
            }
          },
          {
            "name": "rewarderLastUpdatedTime",
            "type": "u64"
          },
          {
            "name": "isPause",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "feeTier",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeRate",
            "type": "u16"
          },
          {
            "name": "tickSpacing",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "partner",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "partnerFeeClaimAuthority",
            "type": "publicKey"
          },
          {
            "name": "pendingAuthority",
            "type": "publicKey"
          },
          {
            "name": "base",
            "type": "publicKey"
          },
          {
            "name": "feeRate",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "startTime",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "clmmpool",
            "type": "publicKey"
          },
          {
            "name": "positionNftMint",
            "type": "publicKey"
          },
          {
            "name": "liquidity",
            "type": "u128"
          },
          {
            "name": "tickLowerIndex",
            "type": "i32"
          },
          {
            "name": "tickUpperIndex",
            "type": "i32"
          },
          {
            "name": "feeGrowthInsideA",
            "type": "u128"
          },
          {
            "name": "feeOwedA",
            "type": "u64"
          },
          {
            "name": "feeGrowthInsideB",
            "type": "u128"
          },
          {
            "name": "feeOwedB",
            "type": "u64"
          },
          {
            "name": "rewarderInfos",
            "type": {
              "array": [
                {
                  "defined": "PositionReward"
                },
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "tickArray",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "arrayIndex",
            "type": "u16"
          },
          {
            "name": "tickSpacing",
            "type": "u16"
          },
          {
            "name": "clmmpool",
            "type": "publicKey"
          },
          {
            "name": "ticks",
            "type": {
              "array": [
                {
                  "defined": "Tick"
                },
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "tickArrayMap",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bitmap",
            "type": {
              "array": [
                "u8",
                868
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Rewarder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintWrapper",
            "type": "publicKey"
          },
          {
            "name": "minter",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "emissionsPerSecond",
            "type": "u128"
          },
          {
            "name": "growthGlobal",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "PositionReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "growthInside",
            "type": "u128"
          },
          {
            "name": "amountOwed",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Tick",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "i32"
          },
          {
            "name": "sqrtPrice",
            "type": "u128"
          },
          {
            "name": "liquidityNet",
            "type": "i128"
          },
          {
            "name": "liquidityGross",
            "type": "u128"
          },
          {
            "name": "feeGrowthOutsideA",
            "type": "u128"
          },
          {
            "name": "feeGrowthOutsideB",
            "type": "u128"
          },
          {
            "name": "rewardGrowthOutside",
            "type": {
              "array": [
                "u128",
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "LOK"
          },
          {
            "name": "NumberCastError"
          },
          {
            "name": "ZeroMintAmount"
          },
          {
            "name": "IntegerDowncastOverflow"
          },
          {
            "name": "MultiplicationOverflow"
          },
          {
            "name": "DivisorIsZero"
          },
          {
            "name": "TokenAmountMinSubceeded"
          },
          {
            "name": "TokenAmountMaxExceeded"
          },
          {
            "name": "SqrtPriceOutOfBounds"
          },
          {
            "name": "ProtocolFeeRateIllegal"
          },
          {
            "name": "FeeRateIllegal"
          },
          {
            "name": "TokenMintPairIllgal"
          },
          {
            "name": "TickArrayStartIndexIllegal"
          },
          {
            "name": "InvalidTickSpacing"
          },
          {
            "name": "InvalidTickIndex"
          },
          {
            "name": "InvalidTickArrayAccount"
          },
          {
            "name": "PositionIsNotEmpty"
          },
          {
            "name": "InvalidTokenAccountOwner"
          },
          {
            "name": "TickNotFound"
          },
          {
            "name": "TickNotInArray"
          },
          {
            "name": "InvalidTokenAccount"
          },
          {
            "name": "InvalidMint"
          },
          {
            "name": "InvalidAuthority"
          },
          {
            "name": "PositionAndClmmpoolNotMatch"
          },
          {
            "name": "PositionIllegal"
          },
          {
            "name": "InvalidDeltaLiquidity"
          },
          {
            "name": "ConfigAndPoolNotMatch"
          },
          {
            "name": "WrongSqrtPriceLimit"
          },
          {
            "name": "TickArrayNotFound"
          },
          {
            "name": "InvalidTickArrayIndex"
          },
          {
            "name": "NextTickNotFound"
          },
          {
            "name": "FeeGrowthIllegal"
          },
          {
            "name": "LiquidityOverflow"
          },
          {
            "name": "LiquidityUnderflow"
          },
          {
            "name": "RemainerAmountUnderflow"
          },
          {
            "name": "SwapAmountInOverflow"
          },
          {
            "name": "SwapAmountOutOverflow"
          },
          {
            "name": "SwapFeeAmountOverflow"
          },
          {
            "name": "InvalidTime"
          },
          {
            "name": "AmountInAboveMaximumLimit"
          },
          {
            "name": "AmountOutBelowMaximumLimit"
          },
          {
            "name": "InvalidFixedTokenType"
          },
          {
            "name": "InvalidRewarderIndex"
          },
          {
            "name": "InvalidPartner"
          },
          {
            "name": "InvalidClmmpoolStatus"
          },
          {
            "name": "InvalidClmmpoolMetadataAccount"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "AcceptPartnerClaimAuthorityEvent",
      "fields": [
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "AcceptProtocolAuthorityEvent",
      "fields": [
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CollectFeeEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CollectPartnerFeeEvent",
      "fields": [
        {
          "name": "claimAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CollectProtocolFeeEvent",
      "fields": [
        {
          "name": "claimAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CollectRewarderEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "rewarderMint",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreateClmmPoolEvent",
      "fields": [
        {
          "name": "payer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "feeTier",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenA",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenB",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreateClmmpoolMetadataEvent",
      "fields": [
        {
          "name": "clmmpool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "clmmpoolMetadata",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreateFeeTierEvent",
      "fields": [
        {
          "name": "payer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "feeTier",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreatePartnerEvent",
      "fields": [
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "protocolAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreateTickArrayEvent",
      "fields": [
        {
          "name": "payer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tickArray",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "arrayIndex",
          "type": "u16",
          "index": false
        }
      ]
    },
    {
      "name": "CreateTickArrayMapEvent",
      "fields": [
        {
          "name": "payer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tickArrayMap",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "DecreaseLiquidityEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "deltaLiquidity",
          "type": "u128",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "IncreaseLiquidityEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "deltaLiquidity",
          "type": "u128",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "IncreaseLiquidityWithFixedTokenEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "deltaLiquidity",
          "type": "u128",
          "index": false
        },
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "InitializeClmmConfigEvent",
      "fields": [
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "feeAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "claimAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "createPoolAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "feeRate",
          "type": "u16",
          "index": false
        }
      ]
    },
    {
      "name": "OpenPositionEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "position",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tickLowerIndex",
          "type": "i32",
          "index": false
        },
        {
          "name": "tickUpperIndex",
          "type": "i32",
          "index": false
        }
      ]
    },
    {
      "name": "RemovePositionEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "positionNftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "position",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "SwapEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "aToB",
          "type": "bool",
          "index": false
        },
        {
          "name": "amountIn",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountOut",
          "type": "u64",
          "index": false
        },
        {
          "name": "refAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "feeAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "protocolAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "vaultAAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "vaultBAmount",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "SwapWithPartnerEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "aToB",
          "type": "bool",
          "index": false
        },
        {
          "name": "amountIn",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountOut",
          "type": "u64",
          "index": false
        },
        {
          "name": "refAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "feeAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "protocolAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "vaultAAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "vaultBAmount",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "TransferPartnerClaimAuthorityEvent",
      "fields": [
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "TransferProtocolAuthorityEvent",
      "fields": [
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "UpdateConfigEvent",
      "fields": [
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newProtocolFeeRate",
          "type": {
            "option": "u16"
          },
          "index": false
        },
        {
          "name": "createPoolAuthority",
          "type": {
            "option": "publicKey"
          },
          "index": false
        },
        {
          "name": "claimAuthority",
          "type": {
            "option": "publicKey"
          },
          "index": false
        }
      ]
    },
    {
      "name": "UpdateFeeRateEvent",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "config",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "UpdatePartnerEvent",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "partner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newFeeRate",
          "type": {
            "option": "u16"
          },
          "index": false
        },
        {
          "name": "newClaimAuthority",
          "type": {
            "option": "publicKey"
          },
          "index": false
        }
      ]
    }
  ]
};