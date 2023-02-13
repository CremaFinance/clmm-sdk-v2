use super::clmmpool::{Clmmpool, REWARDER_NUM};
use crate::math::tick_math::{MAX_TICK, MIN_TICK};
use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Default, Eq, PartialEq, Clone, Copy, Debug)]
pub struct Tick {
    //
    pub is_initialized: bool,

    pub index: i32,

    pub sqrt_price: u128,

    pub liquidity_net: i128,
    // 16
    pub liquidity_gross: u128, // 16

    // Q64.64
    pub fee_growth_outside_a: u128,
    // 16
    // Q64.64
    pub fee_growth_outside_b: u128, // 16

    pub reward_growth_outside: [u128; 3],
}

impl Tick {
    pub const LEN: usize = 1 + 4 + 16 + 16 + 16 + 16 + 16 + Clmmpool::REWARD_NUM * 16;

    #[inline]
    #[allow(dead_code)]
    pub fn min(tick_spacing: u16) -> i32 {
        MIN_TICK + MIN_TICK.abs() % tick_spacing as i32
    }

    #[inline]
    #[allow(dead_code)]
    pub fn max(tick_spacing: u16) -> i32 {
        MAX_TICK - MAX_TICK % tick_spacing as i32
    }

    #[allow(dead_code)]
    pub fn get_fee_in_tick_range(
        clmmpool: &Clmmpool,
        tick_lower: Option<&Tick>,
        tick_upper: Option<&Tick>,
        tick_lower_index: i32,
        tick_upper_index: i32,
    ) -> (u128, u128) {
        let (fee_growth_below_a, fee_growth_below_b) = match tick_lower {
            None => (clmmpool.fee_growth_global_a, clmmpool.fee_growth_global_b),
            Some(tick_lower) => match clmmpool.current_tick_index < tick_lower_index {
                true => (
                    clmmpool
                        .fee_growth_global_a
                        .wrapping_sub(tick_lower.fee_growth_outside_a),
                    clmmpool
                        .fee_growth_global_b
                        .wrapping_sub(tick_lower.fee_growth_outside_b),
                ),
                false => (
                    tick_lower.fee_growth_outside_a,
                    tick_lower.fee_growth_outside_b,
                ),
            },
        };
        // By convention, when initializing a tick, no fees have been earned above the tick.
        let (fee_growth_above_a, fee_growth_above_b) = match tick_upper {
            None => (0, 0),
            Some(tick_upper) => match clmmpool.current_tick_index < tick_upper_index {
                true => (
                    tick_upper.fee_growth_outside_a,
                    tick_upper.fee_growth_outside_b,
                ),
                false => (
                    clmmpool
                        .fee_growth_global_a
                        .wrapping_sub(tick_upper.fee_growth_outside_a),
                    clmmpool
                        .fee_growth_global_b
                        .wrapping_sub(tick_upper.fee_growth_outside_b),
                ),
            },
        };
        (
            clmmpool
                .fee_growth_global_a
                .wrapping_sub(fee_growth_below_a)
                .wrapping_sub(fee_growth_above_a),
            clmmpool
                .fee_growth_global_b
                .wrapping_sub(fee_growth_below_b)
                .wrapping_sub(fee_growth_above_b),
        )
    }

    pub fn cross_update(&mut self, pool: &Clmmpool, a_to_b: bool) -> u128 {
        let liquidity = pool.liquidity;
        let signed_liquidity_change = match a_to_b {
            true => -self.liquidity_net,
            false => self.liquidity_net,
        };
        let current_liquidity = if signed_liquidity_change > 0 {
            liquidity
                .checked_add(signed_liquidity_change as u128)
                .unwrap()
        } else {
            liquidity
                .checked_sub(signed_liquidity_change.abs() as u128)
                .unwrap()
        };
        self.fee_growth_outside_a = pool
            .fee_growth_global_a
            .wrapping_sub(self.fee_growth_outside_a);
        self.fee_growth_outside_b = pool
            .fee_growth_global_b
            .wrapping_sub(self.fee_growth_outside_b);

        for idx in 0..REWARDER_NUM {
            if !pool.rewarder_infos.0[idx].is_initialized() {
                continue;
            }
            self.reward_growth_outside[idx] = pool.rewarder_infos.0[idx]
                .growth_global
                .wrapping_sub(self.reward_growth_outside[idx]);
        }
        current_liquidity
    }
}
