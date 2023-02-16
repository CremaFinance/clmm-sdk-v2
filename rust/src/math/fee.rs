use spl_token::ui_amount_to_amount;

pub fn ui_fee_to_lamport(ui_fee: f64) -> u64 {
    ui_amount_to_amount(ui_fee, 6)
}

pub fn ui_fee_to_lamport_4(ui_fee: f64) -> u64 {
    ui_amount_to_amount(ui_fee, 4)
}
