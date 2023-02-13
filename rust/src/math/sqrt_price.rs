use std::fmt;
use std::ops::{Add, Div, Mul};

use rust_decimal::prelude::*;

pub struct SqrtPrice {
    pub fixed_point: u128,
}

impl SqrtPrice {
    #[allow(dead_code)]
    pub fn new(sqrt_price: u128) -> SqrtPrice {
        SqrtPrice {
            fixed_point: sqrt_price,
        }
    }

    #[allow(dead_code)]
    pub fn from(price: Decimal, base_decimal: u8, quote_decimal: u8) -> SqrtPrice {
        let exp = quote_decimal as i32 - base_decimal as i32;
        let multi = Decimal::from_f64(10f64.powi(exp)).unwrap();
        let sqrt_price = multi.mul(price).sqrt().unwrap();
        SqrtPrice {
            fixed_point: sqrt_price
                .mul(Decimal::from_u64(u64::MAX).unwrap())
                .to_u128()
                .unwrap(),
        }
    }

    #[allow(dead_code)]
    pub fn to_decimal(&self) -> Decimal {
        let integer = Decimal::from_i128_with_scale((self.fixed_point >> 64) as i128, 0);
        Decimal::from_i128_with_scale((self.fixed_point & (u64::MAX as u128)) as i128, 0)
            .div(Decimal::from_i128_with_scale(u64::MAX as i128, 0))
            .add(integer)
    }

    #[allow(dead_code)]
    pub fn ui_price(&self, base_decimal: u8, quote_decimal: u8) -> Decimal {
        let d = self.to_decimal();
        let p = d.mul(d);
        let exp = quote_decimal as i32 - base_decimal as i32;
        let multi = Decimal::from_f64(10f64.powi(exp)).unwrap();
        p.div(multi)
    }
}

impl fmt::Display for SqrtPrice {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.fixed_point)
    }
}
