use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug)]
pub struct TickArrayMap {
    pub bitmap: [u8; 868],
}

impl Default for TickArrayMap {
    fn default() -> Self {
        TickArrayMap { bitmap: [0; 868] }
    }
}

impl TickArrayMap {
    pub const MAX_BIT_INDEX: usize = (868 * 8) - 1;
    pub const MIN_BIT_INDEX: usize = 0;

    #[allow(dead_code)]
    pub fn find_address(clmmpool: &Pubkey, program_id: &Pubkey) -> Pubkey {
        let (address, _) =
            Pubkey::find_program_address(&[b"tick_array_map", clmmpool.as_ref()], program_id);
        address
    }

    #[allow(dead_code)]
    pub fn is_seted(&self, bit: usize) -> bool {
        assert!(
            (TickArrayMap::MIN_BIT_INDEX..=TickArrayMap::MAX_BIT_INDEX).contains(&bit),
            "Invalid tick array bit"
        );
        let word_index = bit / 8;
        let word = self.bitmap[word_index];
        if word == 0 {
            return false;
        }
        let word_bit = bit % 8;
        let v = word & (1u8 << word_bit as u32);
        v > 0u8
    }

    #[allow(dead_code)]
    pub fn next_seted(&self, bit: usize, shl: bool) -> Option<usize> {
        assert!(
            (TickArrayMap::MIN_BIT_INDEX..=TickArrayMap::MAX_BIT_INDEX).contains(&bit),
            "Invalid tick array bit"
        );
        let word_index = bit / 8;
        match shl {
            true => {
                let mut shift = bit % 8;
                for index in (0..=word_index).rev() {
                    let word = self.bitmap[index];
                    if word == 0 {
                        shift = 8;
                        continue;
                    }
                    while shift > 0 {
                        if word << (8 - shift) & 0x80 > 0 {
                            return Some(((index * 8) + shift - 1) as usize);
                        }
                        shift -= 1;
                    }
                    shift = 8;
                }
                None
            }
            false => {
                let mut shift = (bit % 8) + 1;
                for index in word_index..868 {
                    let word = self.bitmap[index];
                    if word == 0 {
                        shift = 0;
                        continue;
                    }
                    while shift < 8 {
                        if word >> shift & 0x01 > 0 {
                            return Some(((index * 8) + shift) as usize);
                        }
                        shift += 1;
                    }
                    shift = 0;
                }
                None
            }
        }
    }
}
