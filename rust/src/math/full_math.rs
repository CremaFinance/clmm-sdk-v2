//! A custom implementation of https://github.com/sdroege/rust-muldiv to support phantom overflow resistant
use super::bn::{Downcast, LowHigh, Shift, U128, U256};
use std::ops::{Add, Mul, Shl, Shr};

pub trait FullMath<RHS = Self> {
    /// Output type for the methods of this trait.
    type Output;
    /// Output type for full_mul
    type FullOutput;

    /// Calculates `floor(val * num / divisor)`, i.e. the largest integer less than or equal to the
    /// result of the division.
    fn mul_div_floor(self, num: RHS, denom: RHS) -> Self::Output;

    /// Calculates `round(val * num / divisor)`, i.e. the closest integer to the result of the
    /// division. If both surrounding integers are the same distance (`x.5`), the one with the bigger
    /// absolute value is returned (round away from 0.0).
    fn mul_div_round(self, num: RHS, denom: RHS) -> Self::Output;

    /// Calculates `ceil(val * num / divisor)`, i.e. the the smallest integer greater than or equal to
    /// the result of the division.
    fn mul_div_ceil(self, num: RHS, denom: RHS) -> Self::Output;

    ///
    fn mul_shift_right(self, num: RHS, shift: u32) -> Self::Output;

    ///
    fn mul_shift_left(self, num: RHS, shift: u32) -> Self::Output;

    ///
    fn full_mul(self, num: RHS) -> Self::FullOutput;
}

impl FullMath for u128 {
    type Output = u128;

    type FullOutput = U256;

    fn mul_div_floor(self, num: Self, denom: Self) -> Self::Output {
        let r = self.full_mul(num) / denom;
        r.as_u128()
    }

    fn mul_div_round(self, num: Self, denom: Self) -> Self::Output {
        let r = (self.full_mul(num) + denom >> 1) / denom;
        r.as_u128()
    }

    fn mul_div_ceil(self, num: Self, denom: Self) -> Self::Output {
        let r = (self.full_mul(num) + (denom - 1)) / denom;
        r.as_u128()
    }

    fn mul_shift_right(self, num: Self, shift: u32) -> Self::Output {
        self.full_mul(num).shift_right(shift).as_u128()
    }

    fn mul_shift_left(self, num: Self, shift: u32) -> Self::Output {
        self.full_mul(num).shift_left(shift).as_u128()
    }

    fn full_mul(self, num: Self) -> Self::FullOutput {
        //return v.as_u256() * n.as_u256();
        // do 128 bits multiply
        //                   nh   nl
        //                *  vh   vl
        //                ----------
        // a0 =              vl * nl
        // a1 =         vl * nh
        // b0 =         vh * nl
        // b1 =  + vh * nh
        //       -------------------
        //        c1h  c1l  c0h  c0l
        let mut c0 = self.lo_u128() * num.lo_u128();
        let a1 = self.lo_u128() * num.hi_u128();
        let b0 = self.hi_u128() * num.lo_u128();
        let mut c1 = c0.hi_u128() + a1.lo_u128() + b0.lo_u128();
        c0 = u128::from_hi_lo(c1.lo(), c0.lo());
        c1 = self.hi_u128() * num.hi_u128() + c1.hi_u128() + a1.hi_u128() + b0.hi_u128();
        U256([c0.lo(), c0.hi(), c1.lo(), c1.hi()])
    }
}

impl FullMath for u64 {
    type Output = u64;

    type FullOutput = u128;

    fn mul_div_floor(self, num: Self, denom: Self) -> Self::Output {
        U128::from(self)
            .mul(U128::from(num))
            .checked_div(U128::from(denom))
            .unwrap()
            .as_u64()
    }

    fn mul_div_round(self, num: Self, denom: Self) -> Self::Output {
        U128::from(self)
            .mul(U128::from(num))
            .add(U128::from(denom >> 1))
            .checked_div(U128::from(denom))
            .unwrap()
            .as_u64()
    }

    fn mul_div_ceil(self, num: Self, denom: Self) -> Self::Output {
        U128::from(self)
            .mul(U128::from(num))
            .add(U128::from(denom - 1))
            .checked_div(U128::from(denom))
            .unwrap()
            .as_u64()
    }

    fn mul_shift_right(self, num: Self, shift: u32) -> Self::Output {
        U128::from(self).mul(U128::from(num)).shr(shift).as_u64()
    }

    fn mul_shift_left(self, num: Self, shift: u32) -> Self::Output {
        U128::from(self).mul(U128::from(num)).shl(shift).as_u64()
    }

    fn full_mul(self, num: Self) -> Self::FullOutput {
        U128::from(self).mul(num).as_u128()
    }
}

pub trait DivRoundUpIf<RHS = Self> {
    type Output;

    fn checked_div_round_up_if(self, divisor: RHS, round_up: bool) -> Option<Self::Output>;
}

impl DivRoundUpIf for u128 {
    type Output = u128;

    fn checked_div_round_up_if(self, divisor: Self, round_up: bool) -> Option<Self::Output> {
        if divisor == 0 {
            return None;
        }
        let (quotient, remainer) = (self / divisor, self % divisor);
        if round_up && remainer != 0 {
            Some(quotient + 1)
        } else {
            Some(quotient)
        }
    }
}

impl DivRoundUpIf for U256 {
    type Output = U256;

    fn checked_div_round_up_if(self, divisor: Self, round_up: bool) -> Option<Self::Output> {
        if divisor.is_zero() {
            return None;
        }
        let (quotient, remain) = self.div_mod(divisor);
        if round_up && !remain.is_zero() {
            Some(quotient.add(1))
        } else {
            Some(quotient)
        }
    }
}
