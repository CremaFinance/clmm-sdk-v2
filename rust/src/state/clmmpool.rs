use crate::math::full_math::FullMath;
use borsh::BorshDeserialize;
use solana_sdk::pubkey::Pubkey;

#[allow(dead_code)]
pub const PROTOCOL_FEE_DENOMNINATOR: u64 = 10_000;

pub const REWARDER_NUM: usize = 3;

#[derive(BorshDeserialize, Default, Debug, Clone, Copy)]
pub struct Clmmpool {
    /// clmm_config
    pub clmm_config: Pubkey,
    /// The pool token a mint address.
    pub token_a: Pubkey,
    /// The pool token b mint address.
    pub token_b: Pubkey,

    /// The vault for hold clmmpool's token a.
    pub token_a_vault: Pubkey,
    /// The vault for hold clmmpool's token b.
    pub token_b_vault: Pubkey,

    /// The tick spacing.
    pub tick_spacing: u16,

    pub tick_spacing_seed: u16,

    /// The numerator of fee rate, the denominator is 1_000_000.
    pub fee_rate: u16,
    /// The numerator of protocol fee rate, the denominator is 1_000_0.

    /// The liquidity of current tick index.
    pub liquidity: u128,

    /// The current sqrt price, Q64.64 and MAX/MIN is Q32.64.
    pub current_sqrt_price: u128,
    /// The current tick index.
    pub current_tick_index: i32,

    /// The fee growth a as Q64.64.
    pub fee_growth_global_a: u128,
    /// The fee growth b as Q64.64.
    pub fee_growth_global_b: u128,

    /// The amounts of token a owed to protocol.
    pub fee_protocol_token_a: u64,
    /// The amounts of token b owed to protocol.
    pub fee_protocol_token_b: u64,

    /// The bump
    pub bump: u8,

    pub rewarder_infos: Rewarders,
    pub rewarder_last_updated_time: u64, // 8

    pub is_pause: bool,
}

impl Clmmpool {
    pub const REWARD_NUM: usize = 3;
    pub const LEN: usize = 5 * 32
        + 3 * 2
        + 2 * 16
        + 4
        + 2 * 16
        + 2 * 8
        + 1
        + Clmmpool::REWARD_NUM * Rewarder::LEN
        + 8
        + 1;

    pub fn get_tick_map_address(pool: &Pubkey, program_id: &Pubkey) -> Pubkey {
        let (expect_address, _) =
            Pubkey::find_program_address(&[b"tick_array_map", pool.as_ref()], program_id);
        expect_address
    }

    pub fn update_fee(
        &mut self,
        fee_amount: u64,
        ref_rate: u16,
        protocol_fee_rate: u16,
        is_token_a: bool,
    ) -> (u64, u64) {
        let mut protocol_fee =
            fee_amount.mul_div_ceil(protocol_fee_rate as u64, PROTOCOL_FEE_DENOMNINATOR);

        let pool_fee = fee_amount.checked_sub(protocol_fee).unwrap();
        match is_token_a {
            true => {
                self.fee_protocol_token_a = self.fee_protocol_token_a.wrapping_add(protocol_fee)
            }
            false => {
                self.fee_protocol_token_b = self.fee_protocol_token_b.wrapping_add(protocol_fee)
            }
        }

        let ref_fee = if ref_rate == 0 {
            0u64
        } else {
            protocol_fee.mul_div_floor(ref_rate as u64, PROTOCOL_FEE_DENOMNINATOR)
        };
        protocol_fee = protocol_fee.checked_sub(ref_fee).unwrap();

        if pool_fee == 0 || self.liquidity == 0 {
            return (ref_fee, protocol_fee);
        }

        let growth_fee = ((pool_fee as u128) << 64)
            .checked_div(self.liquidity)
            .unwrap();
        match is_token_a {
            true => {
                self.fee_growth_global_a = self.fee_growth_global_a.wrapping_add(growth_fee);
            }
            false => {
                self.fee_growth_global_b = self.fee_growth_global_b.wrapping_add(growth_fee);
            }
        }
        (ref_fee, protocol_fee)
    }
}

#[derive(Copy, Clone, BorshDeserialize, Default, Debug, Eq, PartialEq)]
pub struct Rewarder {
    pub mint_wrapper: Pubkey,
    pub minter: Pubkey,
    /// Reward token mint.
    pub mint: Pubkey,
    /// Authority account that has permission to initialize the reward and set emissions.
    pub authority: Pubkey,
    /// Q64.64 number that indicates how many tokens per second are earned per unit of liquidity.
    pub emissions_per_second: u128,
    /// Q64.64 number that tracks the total tokens earned per unit of liquidity since the reward
    /// emissions were turned on.
    pub growth_global: u128,
}

impl Rewarder {
    pub const LEN: usize = 32 + 32 + 32 + 32 + 16 + 16;

    pub fn is_initialized(&self) -> bool {
        self.mint.ne(&Pubkey::default())
    }
}

#[derive(Copy, Clone, BorshDeserialize, Default, Debug, PartialEq)]
pub struct Rewarders(pub [Rewarder; 3]);
