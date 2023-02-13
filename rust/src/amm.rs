use anyhow::Result;
use rust_decimal::Decimal;
use serde_json::Value;
use solana_sdk::{account::Account, pubkey::Pubkey};
use std::collections::HashMap;

pub struct QuoteParams {
    pub in_amount: u64,
    pub input_mint: Pubkey,
    pub output_mint: Pubkey,
}

#[derive(Debug, Default, Clone, Copy)]
pub struct Quote {
    pub not_enough_liquidity: bool,
    pub min_in_amount: Option<u64>,
    pub min_out_amount: Option<u64>,
    pub in_amount: u64,
    pub out_amount: u64,
    pub fee_amount: u64,
    pub fee_mint: Pubkey,
    pub fee_pct: Decimal,
    pub price_impact_pct: Decimal,
}

pub type QuoteMintToReferrer = HashMap<Pubkey, Pubkey>;

pub struct SwapParams {
    pub source_mint: Pubkey,
    pub destination_mint: Pubkey,
    pub user_source_token_account: Pubkey,
    pub user_destination_token_account: Pubkey,
    pub user_transfer_authority: Pubkey,
    pub open_order_address: Option<Pubkey>,
    pub quote_mint_to_referrer: Option<QuoteMintToReferrer>,
    pub in_amount: u64,
}

pub trait Amm {
    // Amm name
    fn label(&self) -> String;
    // identifier, should be your pool address
    fn key(&self) -> Pubkey;
    // Token mints that the amm supports for swapping
    fn get_reserve_mint(&self) -> Vec<Pubkey>;
    // Accounts related for quoting and creating ix
    fn get_accounts_to_update(&self) -> Vec<Pubkey>;
    // Picks data necessary to update it's internal state
    fn update(&mut self, accounts_map: &HashMap<Pubkey, Vec<u8>>) -> Result<()>;
    // Returns quote for the given quote params
    fn quote(&self, quote_params: &QuoteParams) -> Result<Quote>;
}

#[derive(Clone, Debug)]
pub struct KeyedAccount {
    pub key: Pubkey,
    pub account: Account,
    pub params: Option<Value>,
    pub tick_array_map: Box<Vec<u8>>,
}
