use std::collections::HashMap;

use crate::state::{
    clmmpool::Clmmpool,
    tick::Tick,
    tick_array::{TickArray, CAP},
    tick_array_map::TickArrayMap,
};
use solana_sdk::pubkey::Pubkey;

#[derive(Clone, Copy)]
pub struct TickArrayInfo {
    pub address: Pubkey,
    /// The tick array index in tick array bit map.
    pub array_index: u16,
    /// The tick spacing
    pub tick_spacing: u16,
    /// The ticks.
    pub ticks: [Tick; CAP],
}

impl TickArrayInfo {
    pub fn from(address: Pubkey, tick_array: &TickArray) -> Self {
        TickArrayInfo {
            address,
            array_index: tick_array.array_index,
            tick_spacing: tick_array.tick_spacing,
            ticks: tick_array.ticks,
        }
    }
    pub fn display_ticks(&self) -> String {
        let mut list = vec![];
        for tick in self.ticks {
            if tick.is_initialized {
                list.push(tick.index);
            }
        }
        format!("{:?}", list)
    }
}

#[derive(Clone, Copy)]
pub struct TickInfo {
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

impl TickInfo {
    pub fn from(t: &Tick) -> Self {
        TickInfo {
            is_initialized: t.is_initialized,
            index: t.index,
            sqrt_price: t.sqrt_price,
            liquidity_net: t.liquidity_net,
            liquidity_gross: t.liquidity_gross,
            fee_growth_outside_a: t.fee_growth_outside_a,
            fee_growth_outside_b: t.fee_growth_outside_b,
            reward_growth_outside: t.reward_growth_outside,
        }
    }
}

#[derive(Default, Clone)]
pub struct PoolInfo {
    pub pool: Clmmpool,
    pub tick_array_map: TickArrayMap,
    pub tick_arrays: Vec<TickArrayInfo>,
    pub ticks: Vec<TickInfo>,
}

impl PoolInfo {
    pub fn ticks_map(&self) -> HashMap<i32, Tick> {
        let mut ticks = HashMap::new();
        for tick in self.ticks.iter() {
            if tick.is_initialized {
                ticks.insert(
                    tick.index,
                    Tick {
                        is_initialized: tick.is_initialized,
                        index: tick.index,
                        sqrt_price: tick.sqrt_price,
                        liquidity_net: tick.liquidity_net,
                        liquidity_gross: tick.liquidity_gross, // 16
                        fee_growth_outside_a: tick.fee_growth_outside_a,
                        fee_growth_outside_b: tick.fee_growth_outside_b, // 16
                        reward_growth_outside: tick.reward_growth_outside,
                    },
                );
            }
        }
        ticks
    }

    pub fn ticks_for_swap(&self, a2b: bool, limit: usize) -> (Vec<Pubkey>, Vec<Tick>) {
        let mut ticks = vec![];
        let mut array_addreses = vec![];
        match a2b {
            true => {
                let next_tick = self.pool.current_tick_index;
                let next_array_index = TickArray::array_index(next_tick, self.pool.tick_spacing);
                let mut count: usize = 0;
                for idx in (0..self.tick_arrays.len()).rev() {
                    if self.tick_arrays[idx].array_index <= next_array_index && count <= limit {
                        array_addreses.push(self.tick_arrays[idx].address.clone());
                        count += 1;
                    }
                }
                for idx in (0..self.ticks.len()).rev() {
                    if self.ticks[idx].index <= next_tick {
                        let tick = self.ticks[idx];
                        ticks.push(Tick {
                            is_initialized: tick.is_initialized,
                            index: tick.index,
                            sqrt_price: tick.sqrt_price,
                            liquidity_net: tick.liquidity_net,
                            liquidity_gross: tick.liquidity_gross, // 16
                            fee_growth_outside_a: tick.fee_growth_outside_a,
                            fee_growth_outside_b: tick.fee_growth_outside_b, // 16
                            reward_growth_outside: tick.reward_growth_outside,
                        });
                    }
                }
            }
            false => {
                let next_tick = self.pool.current_tick_index + 1;
                let next_array_index = TickArray::array_index(next_tick, self.pool.tick_spacing);
                let mut count = 0;
                for idx in 0..self.tick_arrays.len() {
                    if self.tick_arrays[idx].array_index >= next_array_index && count <= limit {
                        array_addreses.push(self.tick_arrays[idx].address.clone());
                        count += 1;
                    }
                }
                for idx in 0..self.ticks.len() {
                    if self.ticks[idx].index >= next_tick {
                        let tick = self.ticks[idx];
                        ticks.push(Tick {
                            is_initialized: tick.is_initialized,
                            index: tick.index,
                            sqrt_price: tick.sqrt_price,
                            liquidity_net: tick.liquidity_net,
                            liquidity_gross: tick.liquidity_gross, // 16
                            fee_growth_outside_a: tick.fee_growth_outside_a,
                            fee_growth_outside_b: tick.fee_growth_outside_b, // 16
                            reward_growth_outside: tick.reward_growth_outside,
                        });
                    }
                }
            }
        }
        (array_addreses, ticks)
    }
}
