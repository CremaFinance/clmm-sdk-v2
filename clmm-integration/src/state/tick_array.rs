use super::tick::Tick;
use crate::math::tick_math::MIN_TICK;
use borsh::BorshDeserialize;
use solana_sdk::pubkey::Pubkey;
use std::ops::{Div, Sub};

pub const CAP: usize = 64;

#[derive(BorshDeserialize, Clone, Copy)]
pub struct TickArray {
    /// The tick array index in tick array bit map.
    pub array_index: u16,
    /// The tick spacing
    pub tick_spacing: u16,
    /// The [Clmmpool] address.
    pub clmmpool: Pubkey,
    /// The ticks.
    pub ticks: [Tick; CAP],
}

impl Default for TickArray {
    #[inline]
    fn default() -> Self {
        TickArray {
            array_index: 0,
            tick_spacing: 0,
            clmmpool: Pubkey::default(),
            ticks: [Tick::default(); CAP],
        }
    }
}

impl TickArray {
    pub const CAP: usize = 64;
    pub const LEN: usize = 2 + 2 + 32 + Tick::LEN * TickArray::CAP;

    pub fn find_address(clmmpool: &Pubkey, array_index: u16, program_id: &Pubkey) -> Pubkey {
        let (address, _) = Pubkey::find_program_address(
            &[
                b"tick_array",
                clmmpool.as_ref(),
                array_index.to_le_bytes().as_ref(),
            ],
            program_id,
        );
        address
    }

    #[inline]
    pub fn array_index(tick_index: i32, tick_spacing: u16) -> u16 {
        let min = Tick::min(tick_spacing);

        let array_spacing = (TickArray::CAP * tick_spacing as usize) as i32;
        ((tick_index - min) / array_spacing) as u16
    }

    #[inline]
    #[allow(dead_code)]
    pub fn array_spacing(&self) -> usize {
        self.tick_spacing as usize * CAP
    }

    #[inline]
    pub fn start_tick_index(&self) -> i32 {
        ({
            let tick_spacing = self.tick_spacing;
            MIN_TICK + MIN_TICK.abs() % tick_spacing as i32
        }) + (self.array_index as usize * self.array_spacing()) as i32
    }

    #[inline]
    #[allow(dead_code)]
    pub fn end_tick_index(&self) -> i32 {
        self.start_tick_index() + self.array_spacing() as i32 - self.tick_spacing as i32
    }

    #[inline]
    #[allow(dead_code)]
    pub fn is_in_array(&self, tick_index: i32) -> bool {
        tick_index >= self.start_tick_index() && tick_index <= self.end_tick_index()
    }

    #[allow(dead_code)]
    pub fn is_min_tick_array(&self) -> bool {
        self.start_tick_index() == {
            let tick_spacing = self.tick_spacing;
            MIN_TICK + MIN_TICK.abs() % tick_spacing as i32
        }
    }

    #[allow(dead_code)]
    pub fn is_max_tick_array(&self) -> bool {
        self.end_tick_index() >= Tick::max(self.tick_spacing)
    }

    #[inline]
    #[allow(dead_code)]
    pub fn tick_offset(self, tick_index: i32) -> usize {
        tick_index
            .sub(self.start_tick_index())
            .div(self.tick_spacing as i32) as usize
    }

    #[allow(dead_code)]
    pub fn get_tick(&self, tick_index: i32) -> Option<&Tick> {
        let offset = self.tick_offset(tick_index);
        if offset < CAP as usize {
            let t = self.ticks[offset as usize];
            if t.is_initialized {
                return Some(&self.ticks[offset as usize]);
            }
        }
        None
    }

    #[allow(dead_code)]
    pub fn search_range(&self, tick_index: i32, a_to_b: bool) -> Option<(usize, usize)> {
        match a_to_b {
            true => {
                if tick_index < self.start_tick_index() {
                    return None;
                }
                let end = if tick_index >= self.end_tick_index() {
                    CAP - 1
                } else {
                    self.tick_offset(tick_index)
                    //let mut offset = self.tick_offset(tick_index);
                    //if tick_index % self.tick_spacing as i32 != 0 {
                    //    offset = offset + 1
                    //}
                    //offset - 1
                };
                Some((0, end))
            }
            false => {
                if tick_index >= self.end_tick_index() {
                    return None;
                }
                let start = if tick_index < self.start_tick_index() {
                    0
                } else {
                    self.tick_offset(tick_index) + 1
                };
                Some((start, CAP - 1))
            }
        }
    }

    #[allow(dead_code)]
    pub fn get_next_initialized_tick(&self, tick_index: i32, a_to_b: bool) -> Option<&Tick> {
        let search_range = self.search_range(tick_index, a_to_b);
        if search_range.is_none() {
            return None;
        }
        let (start, end) = search_range.unwrap();
        match a_to_b {
            true => {
                for i in (start..=end).rev() {
                    let t = self.ticks[i];
                    if t.is_initialized {
                        return Some(&self.ticks[i]);
                    }
                }
                None
            }
            false => {
                for i in start..=end {
                    let t = self.ticks[i];
                    if t.is_initialized {
                        return Some(&self.ticks[i]);
                    }
                }
                None
            }
        }
    }

    #[allow(dead_code)]
    pub fn is_tick_array_valid(&self) -> bool {
        for tick in &self.ticks {
            if tick.is_initialized {
                return true;
            }
        }
        false
    }
}
