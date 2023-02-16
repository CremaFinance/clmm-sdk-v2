use std::{
    ops::{Mul, Shl},
    u128,
};

use super::bn::Downcast;
use crate::error::ErrorCode;

use super::{
    bn::{Shift, U256},
    full_math::{DivRoundUpIf, FullMath},
    tick_math::get_sqrt_price_at_tick,
    tick_math::{MAX_SQRT_PRICE_X64, MIN_SQRT_PRICE_X64},
};

pub const FEE_RATE_DENOMINATOR: u128 = 1_000_000;

#[derive(Debug)]
pub struct SwapStepResult {
    pub next_sqrt_price: u128,
    pub amount_in: u128,
    pub amount_out: u128,
    pub fee_amount: u128,
}

#[allow(dead_code)]
pub fn get_liquidity_from_amount(
    lower_index: i32,
    upper_index: i32,
    current_tick_index: i32,
    current_sqrt_price: u128,
    amount: u128,
    is_fixed_a: bool,
) -> Result<(u128, u128, u128), ErrorCode> {
    let lower_price = get_sqrt_price_at_tick(lower_index);
    let upper_price = get_sqrt_price_at_tick(upper_index);
    let mut amount_a: u128 = 0;
    let mut amount_b: u128 = 0;
    let liquidity: u128;
    match is_fixed_a {
        true => {
            amount_a = amount;
            if current_tick_index < lower_index {
                liquidity = get_liquidity_from_a(lower_price, upper_price, amount, false)?;
            } else if current_tick_index < upper_index {
                liquidity = get_liquidity_from_a(current_sqrt_price, upper_price, amount, false)?;
                amount_b = get_delta_b(current_sqrt_price, lower_price, liquidity, true)?;
            } else {
                return Err(ErrorCode::InvalidFixedTokenType);
            }
        }
        false => {
            amount_b = amount;
            if current_tick_index >= upper_index {
                liquidity = get_liquidity_from_b(lower_price, upper_price, amount, false)?;
            } else if current_tick_index >= lower_index {
                liquidity = get_liquidity_from_b(lower_price, current_sqrt_price, amount, false)?;
                amount_a = get_delta_a(current_sqrt_price, upper_price, liquidity, true)?;
            } else {
                return Err(ErrorCode::InvalidFixedTokenType);
            }
        }
    };
    Ok((liquidity, amount_a, amount_b))
}

/// `liquidity = ( sqrt_price_upper * sqrt_price_lower * delta_a ) / delta_sqrt_price`
pub fn get_liquidity_from_a(
    sqrt_price_0: u128,
    sqrt_price_1: u128,
    amount_a: u128,
    round_up: bool,
) -> Result<u128, ErrorCode> {
    let sqrt_price_diff = if sqrt_price_0 > sqrt_price_1 {
        sqrt_price_0 - sqrt_price_1
    } else {
        sqrt_price_1 - sqrt_price_0
    };

    // sqrt_price_0 and sqrt_price_1 are all Q32.64(96 bit), so sqrt_price_0 * sqrt_price_1 * amount_a, the result max (numberator) is u256.
    let numberator = sqrt_price_0.full_mul(sqrt_price_1).mul(amount_a as u64);
    let div_res = numberator
        .checked_div_round_up_if(U256::from(sqrt_price_diff).shift_word_left(), round_up)
        .ok_or(ErrorCode::DivisorIsZero)?
        .as_u128();
    Ok(div_res)
}

/// `liquidity = delta_b / delta_sqrt_price`
pub fn get_liquidity_from_b(
    sqrt_price_0: u128,
    sqrt_price_1: u128,
    amount_b: u128,
    round_up: bool,
) -> Result<u128, ErrorCode> {
    let sqrt_price_diff = if sqrt_price_0 > sqrt_price_1 {
        sqrt_price_0 - sqrt_price_1
    } else {
        sqrt_price_1 - sqrt_price_0
    };
    let div_res = U256::from(amount_b)
        .checked_shift_word_left()
        .unwrap()
        .checked_div_round_up_if(U256::from(sqrt_price_diff), round_up)
        .ok_or(ErrorCode::DivisorIsZero)?
        .as_u128();
    Ok(div_res)
}

/// Gets the amount_a delta between two prices, for given amount of liquidity
/// # Formula
/// `delta_a = (liquidity * delta_sqrt_price) / (sqrt_price_upper * sqrt_price_lower)`
/// # Params
/// * `sqrt_price_0` - A sqrt price
/// * `sqrt_price_1` - Another sqrt price
/// * `liquidity` - The amount of usable liquidity
/// * `round_up`- Whether to round the amount up or down
pub fn get_delta_a(
    sqrt_price_0: u128,
    sqrt_price_1: u128,
    liquidity: u128,
    round_up: bool,
) -> Result<u128, ErrorCode> {
    let sqrt_price_diff = if sqrt_price_0 > sqrt_price_1 {
        sqrt_price_0 - sqrt_price_1
    } else {
        sqrt_price_1 - sqrt_price_0
    };
    let numberator = liquidity
        .full_mul(sqrt_price_diff)
        .checked_shift_word_left()
        .ok_or(ErrorCode::MultiplicationOverflow)?;
    let denomminator = sqrt_price_0.full_mul(sqrt_price_1);
    let (quotient, remainder) = numberator.div_mod(denomminator);
    match round_up && !remainder.is_zero() {
        true => (quotient + 1)
            .checked_as_u128()
            .ok_or(ErrorCode::IntegerDowncastOverflow),
        false => quotient
            .checked_as_u128()
            .ok_or(ErrorCode::IntegerDowncastOverflow),
    }
}

/// Gets the amount_b delta between two prices, for given amount of liquidity
/// # Formula
/// * `delta_b = delta_sqrt_price * liquidity`
/// # Params
/// * `sqrt_price_0` - A sqrt price
/// * `sqrt_price_1` - Another sqrt price
/// * `liquidity` - The amount of usable liquidity
/// * `round_up`- Whether to round the amount up or down
pub fn get_delta_b(
    sqrt_price_0: u128,
    sqrt_price_1: u128,
    liquidity: u128,
    round_up: bool,
) -> Result<u128, ErrorCode> {
    let sqrt_price_diff = if sqrt_price_0 > sqrt_price_1 {
        sqrt_price_0 - sqrt_price_1
    } else {
        sqrt_price_1 - sqrt_price_0
    };
    if liquidity == 0 || sqrt_price_diff == 0 {
        return Ok(0);
    }

    let product = liquidity.full_mul(sqrt_price_diff);
    let should_round_up = round_up && product.0[0] > 0;
    let result = product
        .shift_word_right()
        .checked_as_u128()
        .ok_or(ErrorCode::MultiplicationOverflow)?;

    match should_round_up {
        true => result
            .checked_add(1)
            .ok_or(ErrorCode::MultiplicationOverflow),
        false => Ok(result),
    }
}

/// Gets the next sqrt price from given a delta of token_a
/// # Formula
/// `sqrt_price_new = (sqrt_price * liquidity) / (liquidity +- amount * sqrt_price)`
/// # Arguments
/// * `sqrt_price` - The starting price `√P`
/// * `liquidity` - The amount of usable liquidity L
/// * `amount` - Delta of token a
/// * `add` - Whether to add or remove the amount of token_a
pub fn get_next_sqrt_price_a_up(
    sqrt_price: u128,
    liquidity: u128,
    amount: u128,
    by_amount_input: bool,
) -> Result<u128, ErrorCode> {
    if amount == 0 {
        return Ok(sqrt_price);
    }

    let numberator = sqrt_price
        .full_mul(liquidity)
        .checked_shift_word_left()
        .ok_or(ErrorCode::MultiplicationOverflow)?;
    let liquidity_shl_64 = U256::from(liquidity).shift_word_left();
    let product = sqrt_price.full_mul(amount as u128);

    let quotient = match by_amount_input {
        true => numberator
            .checked_div_round_up_if(liquidity_shl_64.checked_add(product).unwrap(), true)
            .ok_or(ErrorCode::DivisorIsZero)?,
        false => numberator
            .checked_div_round_up_if(liquidity_shl_64.checked_sub(product).unwrap(), true)
            .ok_or(ErrorCode::DivisorIsZero)?,
    };

    let new_sqrt_price = quotient
        .checked_as_u128()
        .ok_or(ErrorCode::IntegerDowncastOverflow)?;

    if new_sqrt_price > MAX_SQRT_PRICE_X64 {
        return Err(ErrorCode::TokenAmountMaxExceeded);
    } else if new_sqrt_price < MIN_SQRT_PRICE_X64 {
        return Err(ErrorCode::TokenAmountMinSubceeded);
    }

    Ok(new_sqrt_price)
}

/// Gets the next sqrt price given a delta of token_b
/// # Formula
/// * `new_sqrt_price = sqrt_price + (delta_b / liquidity)`
/// # Arguments
/// * `sqrt_price` - The starting price `√P`, i.e., before accounting for the token_1 delta
/// * `liquidity` - The amount of usable liquidity L
/// * `amount` - Delta of token 1 (Δy) to add or remove from virtual reserves
/// * `add` - Whether to add or remove the amount of token_1
pub fn get_next_sqrt_price_b_down(
    sqrt_price: u128,
    liquidity: u128,
    amount: u128,
    by_amount_input: bool,
) -> Result<u128, ErrorCode> {
    let delta_sqrt_price = amount
        .shl(64u32)
        .checked_div_round_up_if(liquidity, !by_amount_input)
        .ok_or(ErrorCode::DivisorIsZero)?;
    let new_sqrt_price = match by_amount_input {
        true => sqrt_price
            .checked_add(delta_sqrt_price)
            .ok_or(ErrorCode::SqrtPriceOutOfBounds)?,
        false => sqrt_price
            .checked_sub(delta_sqrt_price)
            .ok_or(ErrorCode::SqrtPriceOutOfBounds)?,
    };

    if !(MIN_SQRT_PRICE_X64..=MAX_SQRT_PRICE_X64).contains(&new_sqrt_price) {
        return Err(ErrorCode::SqrtPriceOutOfBounds);
    }
    Ok(new_sqrt_price)
}

pub fn get_next_sqrt_price_from_input(
    sqrt_price: u128,
    liquidity: u128,
    amount: u128,
    a_to_b: bool,
) -> Result<u128, ErrorCode> {
    match a_to_b {
        true => get_next_sqrt_price_a_up(sqrt_price, liquidity, amount, true),
        false => get_next_sqrt_price_b_down(sqrt_price, liquidity, amount, true),
    }
}

pub fn get_next_sqrt_price_from_output(
    sqrt_price: u128,
    liquidity: u128,
    amount: u128,
    a_to_b: bool,
) -> Result<u128, ErrorCode> {
    match a_to_b {
        true => get_next_sqrt_price_b_down(sqrt_price, liquidity, amount, false),
        false => get_next_sqrt_price_a_up(sqrt_price, liquidity, amount, false),
    }
}

pub fn get_delta_up_from_input(
    current_sqrt_price: u128,
    target_sqrt_price: u128,
    liquidity: u128,
    a_to_b: bool,
) -> Result<u128, ErrorCode> {
    match a_to_b {
        true => get_delta_a(target_sqrt_price, current_sqrt_price, liquidity, true),
        false => get_delta_b(current_sqrt_price, target_sqrt_price, liquidity, true),
    }
}

pub fn get_delta_down_from_output(
    current_sqrt_price: u128,
    target_sqrt_price: u128,
    liquidity: u128,
    a_to_b: bool,
) -> Result<u128, ErrorCode> {
    match a_to_b {
        true => get_delta_b(target_sqrt_price, current_sqrt_price, liquidity, false),
        false => get_delta_a(current_sqrt_price, target_sqrt_price, liquidity, false),
    }
}

pub fn compute_swap_step(
    current_sqrt_price: u128,
    target_sqrt_price: u128,
    liquidity: u128,
    amount: u128,
    fee_rate: u16,
    by_amount_input: bool,
) -> Result<SwapStepResult, ErrorCode> {
    if liquidity == 0 {
        return Ok(SwapStepResult {
            amount_in: 0u128,
            amount_out: 0u128,
            next_sqrt_price: target_sqrt_price,
            fee_amount: 0u128,
        });
    }

    let a_to_b = current_sqrt_price >= target_sqrt_price;
    let next_sqrt_price;
    let amount_in: u128;
    let amount_out: u128;
    let fee_amount: u128;

    match by_amount_input {
        true => {
            let amount_remain = amount.mul_div_floor(
                FEE_RATE_DENOMINATOR.checked_sub(fee_rate as u128).unwrap(),
                FEE_RATE_DENOMINATOR,
            );
            let max_amount_in =
                get_delta_up_from_input(current_sqrt_price, target_sqrt_price, liquidity, a_to_b)?;
            if max_amount_in > amount_remain {
                amount_in = amount_remain;
                fee_amount = amount.checked_sub(amount_remain).unwrap();
                next_sqrt_price = get_next_sqrt_price_from_input(
                    current_sqrt_price,
                    liquidity,
                    amount_remain,
                    a_to_b,
                )?;
            } else {
                amount_in = max_amount_in;
                fee_amount = amount_in
                    .mul_div_ceil(fee_rate as u128, FEE_RATE_DENOMINATOR - fee_rate as u128);
                next_sqrt_price = target_sqrt_price;
            }
            amount_out =
                get_delta_down_from_output(current_sqrt_price, next_sqrt_price, liquidity, a_to_b)?;
        }
        false => {
            let max_amount_out = get_delta_down_from_output(
                current_sqrt_price,
                target_sqrt_price,
                liquidity,
                a_to_b,
            )?;
            if max_amount_out > amount {
                amount_out = amount;
                next_sqrt_price =
                    get_next_sqrt_price_from_output(current_sqrt_price, liquidity, amount, a_to_b)?;
            } else {
                amount_out = max_amount_out;
                next_sqrt_price = target_sqrt_price;
            }
            amount_in =
                get_delta_up_from_input(current_sqrt_price, next_sqrt_price, liquidity, a_to_b)?;
            fee_amount =
                amount_in.mul_div_ceil(fee_rate as u128, FEE_RATE_DENOMINATOR - fee_rate as u128);
        }
    }

    Ok(SwapStepResult {
        amount_in,
        amount_out,
        next_sqrt_price,
        fee_amount,
    })
}
