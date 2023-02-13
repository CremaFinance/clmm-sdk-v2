use crate::math::full_math::FullMath;

pub const MIN_TICK: i32 = -443636;
pub const MAX_TICK: i32 = -MIN_TICK;

pub const MAX_SQRT_PRICE_X64: u128 = 79226673515401279992447579055;
pub const MIN_SQRT_PRICE_X64: u128 = 4295048016;

pub fn get_sqrt_price_at_tick(tick: i32) -> u128 {
    if tick >= 0 {
        get_sqrt_price_at_positive_tick(tick)
    } else {
        get_sqrt_price_at_negative_tick(tick)
    }
}

fn get_sqrt_price_at_negative_tick(tick: i32) -> u128 {
    let abs_tick = tick.abs();

    let mut ratio: u128 = if abs_tick & 0x1 != 0 {
        18445821805675392311u128
    } else {
        18446744073709551616u128
    };

    const SHIFT_64: u32 = 64;
    if abs_tick & 0x2 != 0 {
        ratio = ratio.mul_shift_right(18444899583751176498u128, SHIFT_64);
    }
    if abs_tick & 0x4 != 0 {
        ratio = ratio.mul_shift_right(18443055278223354162u128, SHIFT_64);
    }
    if abs_tick & 0x8 != 0 {
        ratio = ratio.mul_shift_right(18439367220385604838u128, SHIFT_64);
    }
    if abs_tick & 0x10 != 0 {
        ratio = ratio.mul_shift_right(18431993317065449817u128, SHIFT_64);
    }
    if abs_tick & 0x20 != 0 {
        ratio = ratio.mul_shift_right(18417254355718160513u128, SHIFT_64);
    }
    if abs_tick & 0x40 != 0 {
        ratio = ratio.mul_shift_right(18387811781193591352u128, SHIFT_64);
    }
    if abs_tick & 0x80 != 0 {
        ratio = ratio.mul_shift_right(18329067761203520168u128, SHIFT_64);
    }
    if abs_tick & 0x100 != 0 {
        ratio = ratio.mul_shift_right(18212142134806087854u128, SHIFT_64);
    }
    if abs_tick & 0x200 != 0 {
        ratio = ratio.mul_shift_right(17980523815641551639u128, SHIFT_64);
    }
    if abs_tick & 0x400 != 0 {
        ratio = ratio.mul_shift_right(17526086738831147013u128, SHIFT_64);
    }
    if abs_tick & 0x800 != 0 {
        ratio = ratio.mul_shift_right(16651378430235024244u128, SHIFT_64);
    }
    if abs_tick & 0x1000 != 0 {
        ratio = ratio.mul_shift_right(15030750278693429944u128, SHIFT_64);
    }
    if abs_tick & 0x2000 != 0 {
        ratio = ratio.mul_shift_right(12247334978882834399u128, SHIFT_64);
    }
    if abs_tick & 0x4000 != 0 {
        ratio = ratio.mul_shift_right(8131365268884726200u128, SHIFT_64);
    }
    if abs_tick & 0x8000 != 0 {
        ratio = ratio.mul_shift_right(3584323654723342297u128, SHIFT_64);
    }
    if abs_tick & 0x10000 != 0 {
        ratio = ratio.mul_shift_right(696457651847595233u128, SHIFT_64);
    }
    if abs_tick & 0x20000 != 0 {
        ratio = ratio.mul_shift_right(26294789957452057u128, SHIFT_64);
    }
    if abs_tick & 0x40000 != 0 {
        ratio = ratio.mul_shift_right(37481735321082u128, SHIFT_64);
    }

    ratio
}

fn get_sqrt_price_at_positive_tick(tick: i32) -> u128 {
    let mut ratio = if tick & 0x1 != 0 {
        79232123823359799118286999567u128
    } else {
        79228162514264337593543950336u128
    };

    const SHIFT_96: u32 = 96;
    if tick & 0x2 != 0 {
        ratio = ratio.mul_shift_right(79236085330515764027303304731u128, SHIFT_96)
    }
    if tick & 0x4 != 0 {
        ratio = ratio.mul_shift_right(79244008939048815603706035061u128, SHIFT_96)
    }
    if tick & 0x8 != 0 {
        ratio = ratio.mul_shift_right(79259858533276714757314932305u128, SHIFT_96)
    }
    if tick & 0x10 != 0 {
        ratio = ratio.mul_shift_right(79291567232598584799939703904u128, SHIFT_96)
    }
    if tick & 0x20 != 0 {
        ratio = ratio.mul_shift_right(79355022692464371645785046466u128, SHIFT_96)
    }
    if tick & 0x40 != 0 {
        ratio = ratio.mul_shift_right(79482085999252804386437311141u128, SHIFT_96)
    }
    if tick & 0x80 != 0 {
        ratio = ratio.mul_shift_right(79736823300114093921829183326u128, SHIFT_96)
    }
    if tick & 0x100 != 0 {
        ratio = ratio.mul_shift_right(80248749790819932309965073892u128, SHIFT_96)
    }
    if tick & 0x200 != 0 {
        ratio = ratio.mul_shift_right(81282483887344747381513967011u128, SHIFT_96)
    }
    if tick & 0x400 != 0 {
        ratio = ratio.mul_shift_right(83390072131320151908154831281u128, SHIFT_96)
    }
    if tick & 0x800 != 0 {
        ratio = ratio.mul_shift_right(87770609709833776024991924138u128, SHIFT_96)
    }
    if tick & 0x1000 != 0 {
        ratio = ratio.mul_shift_right(97234110755111693312479820773u128, SHIFT_96)
    }
    if tick & 0x2000 != 0 {
        ratio = ratio.mul_shift_right(119332217159966728226237229890u128, SHIFT_96)
    }
    if tick & 0x4000 != 0 {
        ratio = ratio.mul_shift_right(179736315981702064433883588727u128, SHIFT_96)
    }
    if tick & 0x8000 != 0 {
        ratio = ratio.mul_shift_right(407748233172238350107850275304u128, SHIFT_96)
    }
    if tick & 0x10000 != 0 {
        ratio = ratio.mul_shift_right(2098478828474011932436660412517u128, SHIFT_96)
    }
    if tick & 0x20000 != 0 {
        ratio = ratio.mul_shift_right(55581415166113811149459800483533u128, SHIFT_96)
    }
    if tick & 0x40000 != 0 {
        ratio = ratio.mul_shift_right(38992368544603139932233054999993551u128, SHIFT_96)
    }

    ratio >> 32
}

pub fn get_tick_at_sqrt_price(sqrt_price_x64: u128) -> i32 {
    let mut r = sqrt_price_x64;
    let mut msb = 0; // in [1, 128)

    // ------------------------------------------------------
    // Decimal part of logarithm = MSB
    // Binary search method: 2^32, 2^16, 2^8, 2^4, 2^2 and 2^1 for U64.64
    let mut f: u8 = ((r >= 0x10000000000000000) as u8) << 6; // If r >= 2^64, f = 64 else 0
    msb |= f;
    r >>= f;

    f = ((r >= 0x100000000) as u8) << 5; // 2^32
    msb |= f; // Add f to MSB
    r >>= f; // Right shift by f

    f = ((r >= 0x10000) as u8) << 4; // 2^16
    msb |= f;
    r >>= f;

    f = ((r >= 0x100) as u8) << 3; // 2^8
    msb |= f;
    r >>= f;

    f = ((r >= 0x10) as u8) << 2; // 2^4
    msb |= f;
    r >>= f;

    f = ((r >= 0x4) as u8) << 1; // 2^2
    msb |= f;
    r >>= f;

    f = ((r >= 0x2) as u8) << 0; // 2^0
    msb |= f;

    // log2 (m x 2^e) = log2 (m) + e
    // For U64.64, e = -64. Subtract by 64 to remove x64 notation.
    // Then left shift by 16 bits to convert into U96.32 form
    let mut log_2_x32 = (msb as i128 - 64) << 32;
    // ------------------------------------------------------
    // Fractional part of logarithm

    // Set r = r / 2^n as a Q65.63 number, where n stands for msb
    r = if msb >= 64 {
        sqrt_price_x64 >> (msb - 63)
    } else {
        sqrt_price_x64 << (63 - msb)
    };

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 31;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 30;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 29;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 28;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 27;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 26;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 25;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 24;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 23;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 22;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 21;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 20;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 19;
    r >>= f;

    r = (r * r) >> 63;
    f = (r >> 64) as u8;
    log_2_x32 |= (f as i128) << 18;

    let log_sqrt_10001 = log_2_x32 * 59543866431366;

    let tick_low = ((log_sqrt_10001 - 184467440737095516) >> 64) as i32;
    let tick_high = ((log_sqrt_10001 + 15793534762490258745) >> 64) as i32;

    if tick_low == tick_high {
        tick_low
    } else if get_sqrt_price_at_tick(tick_high) <= sqrt_price_x64 {
        tick_high
    } else {
        tick_low
    }
}
