use uint::construct_uint;

construct_uint! {
    pub struct U128(2);
}

construct_uint! {
    pub struct U256(4);
}

pub trait Upcast {
    fn as_u256(self) -> U256;
}

impl Upcast for U128 {
    fn as_u256(self) -> U256 {
        U256([self.0[0], self.0[1], 0, 0])
    }
}

pub trait Downcast {
    fn as_u128(self) -> u128;

    fn as_u64(self) -> u64;

    fn checked_as_u128(self) -> Option<u128>;

    fn checked_as_u64(self) -> Option<u64>;

    fn is_zero(self) -> bool;
}

impl Downcast for U256 {
    #[inline]
    fn as_u128(self) -> u128 {
        self.checked_as_u128().unwrap()
    }

    #[inline]
    fn as_u64(self) -> u64 {
        self.checked_as_u64().unwrap()
    }

    #[inline]
    fn checked_as_u128(self) -> Option<u128> {
        if self.0[2] != 0 || self.0[3] != 0 {
            return None;
        }
        Some(((self.0[1] as u128) << 64) + self.0[0] as u128)
    }

    #[inline]
    fn checked_as_u64(self) -> Option<u64> {
        if self.0[1] != 0 || self.0[2] != 0 || self.0[3] != 0 {
            return None;
        }
        Some(self.0[0])
    }

    #[inline]
    fn is_zero(self) -> bool {
        return self.0[0] == 0 && self.0[1] == 0 && self.0[2] == 0 && self.0[3] == 0;
    }
}

pub trait LowHigh {
    fn lo(self) -> u64;
    fn hi(self) -> u64;
    fn lo_u128(self) -> u128;
    fn hi_u128(self) -> u128;
    fn from_hi_lo(hi: u64, lo: u64) -> u128;
}

const U64_MAX: u128 = u64::MAX as u128;
impl LowHigh for u128 {
    #[inline]
    fn lo(self) -> u64 {
        (self & U64_MAX) as u64
    }

    #[inline]
    fn hi(self) -> u64 {
        (self >> 64) as u64
    }

    #[inline]
    fn lo_u128(self) -> u128 {
        self & U64_MAX
    }

    #[inline]
    fn hi_u128(self) -> u128 {
        self >> 64
    }

    #[inline]
    fn from_hi_lo(hi: u64, lo: u64) -> u128 {
        (hi as u128) << 64 | (lo as u128)
    }
}

pub trait Shift {
    type Output;

    fn shift_left(self, num: u32) -> Self::Output;

    fn shift_word_left(self) -> Self::Output;

    fn checked_shift_word_left(self) -> Option<Self::Output>;

    fn shift_right(self, num: u32) -> Self::Output;

    fn shift_word_right(self) -> Self::Output;
}

impl Shift for U256 {
    type Output = U256;

    // Shift left, does not trigger overflow
    fn shift_left(self, mut num: u32) -> Self::Output {
        if num >= 256u32 {
            return U256([0, 0, 0, 0]);
        }

        let mut result = self.clone();

        while num > 64 {
            result = result.shift_word_left();
            num -= 64;
        }
        if num == 0 {
            return result;
        }

        result.0[3] = result.0[3] << num | (result.0[2] >> (64 - num));
        result.0[2] = result.0[2] << num | (result.0[1] >> (64 - num));
        result.0[1] = result.0[1] << num | (result.0[0] >> (64 - num));
        result.0[0] = result.0[0] << num;

        result
    }

    // Shift left 64, does not trigger overflow
    #[inline]
    fn shift_word_left(self) -> Self::Output {
        U256([0, self.0[0], self.0[1], self.0[2]])
    }

    #[inline]
    fn checked_shift_word_left(self) -> Option<Self::Output> {
        if self.0[3] > 0 {
            return None;
        }
        Some(self.shift_word_left())
    }

    // Shift right, does not trigger overflow
    fn shift_right(self, mut num: u32) -> Self::Output {
        if num >= 256u32 {
            return U256([0, 0, 0, 0]);
        }

        let mut result = self.clone();

        while num >= 64 {
            result = result.shift_word_right();
            num -= 64;
        }
        if num == 0 {
            return result;
        }

        result.0[0] = result.0[0] >> num | (result.0[1] << (64 - num));
        result.0[1] = result.0[1] >> num | (result.0[2] << (64 - num));
        result.0[2] = result.0[2] >> num | (result.0[3] << (64 - num));
        result.0[3] = result.0[3] >> num;

        result
    }

    // Shift right 64, does not trigger overflow
    #[inline]
    fn shift_word_right(self) -> Self::Output {
        U256([self.0[1], self.0[2], self.0[3], 0])
    }
}
