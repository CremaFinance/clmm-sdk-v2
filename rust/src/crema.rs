use borsh::BorshDeserialize;
use lazy_static::lazy_static;
use rust_decimal::Decimal;
use solana_sdk::{pubkey, pubkey::Pubkey};
use std::collections::HashMap;
use std::ops::{Div, Mul, Sub};

use crate::pair::fetcher::{TickArrayInfo, TickInfo};
use crate::state::clmmpool::Clmmpool;
use crate::state::tick_array_map::TickArrayMap;
use crate::{
    amm::{Amm, KeyedAccount, Quote, QuoteParams},
    math::sqrt_price::SqrtPrice,
    pair::{fetcher::PoolInfo, simulate_swap::compute_swap},
    state::tick_array::TickArray,
};
use anyhow::Result;

mod crema_programs {
    use super::*;
    pub const CREMA: Pubkey = pubkey!("CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR");
}

lazy_static! {
    pub static ref CREMA_PROGRAMS: HashMap<Pubkey, String> = {
        let mut m = HashMap::new();
        m.insert(crema_programs::CREMA, "Crema".into());
        m
    };
}

pub struct CremaClmm {
    key: Pubkey,
    label: String,
    reserve_mints: [Pubkey; 2],
    reserve_decimals: [u8; 2],
    program_id: Pubkey,
    pool_address: Pubkey,
    fee_rate: u16,
    pool_info: PoolInfo,
    tick_array_map_addr: Pubkey,
}

impl CremaClmm {
    pub fn from_keyed_account(keyed_account: &KeyedAccount) -> Result<Self> {
        let clmmpool = Clmmpool::try_from_slice(&keyed_account.account.data[8..]).unwrap();
        let reserve_mints = [clmmpool.token_a.clone(), clmmpool.token_b.clone()];
        let label = CREMA_PROGRAMS
            .get(&keyed_account.account.owner)
            .unwrap()
            .clone();

        let mut pool_info = PoolInfo::default();
        pool_info.pool = clmmpool;

        let tick_array_map_addr =
            TickArrayMap::find_address(&keyed_account.key, &keyed_account.account.owner);
        let tick_array_map =
            TickArrayMap::try_from_slice(&(*keyed_account.tick_array_map)[8..]).unwrap();
        pool_info.tick_array_map = tick_array_map;

        Ok(Self {
            key: keyed_account.key,
            label,
            reserve_mints,
            reserve_decimals: [keyed_account.decimals_a, keyed_account.decimals_b],
            program_id: keyed_account.account.owner,
            pool_address: keyed_account.key,
            pool_info,
            fee_rate: 0,
            tick_array_map_addr,
        })
    }

    #[allow(dead_code)]
    fn get_authority(&self) -> Pubkey {
        Pubkey::find_program_address(&[&self.key.to_bytes()], &self.program_id).0
    }

    #[allow(dead_code)]
    fn clone(&self) -> CremaClmm {
        CremaClmm {
            key: self.key,
            label: self.label.clone(),
            reserve_mints: self.reserve_mints,
            reserve_decimals: self.reserve_decimals,
            fee_rate: self.fee_rate,
            pool_address: self.pool_address,
            pool_info: PoolInfo {
                pool: self.pool_info.pool.clone(),
                tick_array_map: self.pool_info.tick_array_map.clone(),
                tick_arrays: self.pool_info.tick_arrays.clone(),
                ticks: self.pool_info.ticks.clone(),
            },
            tick_array_map_addr: self.tick_array_map_addr,
            program_id: self.program_id,
        }
    }
}

impl Amm for CremaClmm {
    fn label(&self) -> String {
        self.label.clone()
    }

    fn key(&self) -> Pubkey {
        self.key
    }

    fn get_reserve_mint(&self) -> Vec<Pubkey> {
        self.reserve_mints.to_vec()
    }

    fn get_accounts_to_update(&self) -> Vec<Pubkey> {
        let mut accounts = vec![self.pool_address];
        accounts.push(self.tick_array_map_addr);

        let mut tick_arrays = vec![];
        for array_index in 0..868 * 8 {
            if !self.pool_info.tick_array_map.is_seted(array_index) {
                continue;
            }
            let address =
                TickArray::find_address(&self.pool_address, array_index as u16, &self.program_id);
            tick_arrays.push(address);
        }

        println!("tick arrays: {:?}", tick_arrays);

        accounts.extend(tick_arrays.iter());
        accounts
    }

    fn update(&mut self, accounts_map: &HashMap<Pubkey, Vec<u8>>) -> Result<()> {
        let clmmpool_data = accounts_map.get(&self.pool_address).unwrap();
        self.pool_info.pool = Clmmpool::try_from_slice(&clmmpool_data[8..]).unwrap();
        self.fee_rate = self.pool_info.pool.fee_rate;
        self.reserve_mints = [self.pool_info.pool.token_a, self.pool_info.pool.token_b];

        let tick_array_map_data = accounts_map.get(&self.tick_array_map_addr).unwrap();

        self.pool_info.tick_array_map =
            TickArrayMap::try_from_slice(&tick_array_map_data[8..]).unwrap();

        // fetch tick array
        let mut ticks = vec![];
        let mut tick_arrays = vec![];

        for array_index in 0..868 * 8 {
            if !self.pool_info.tick_array_map.is_seted(array_index) {
                continue;
            }
            let address =
                TickArray::find_address(&self.pool_address, array_index as u16, &self.program_id);
            let tick_array_data = accounts_map.get(&address).unwrap();
            let tick_array: TickArray = TickArray::try_from_slice(&tick_array_data[8..]).unwrap();
            tick_arrays.push(TickArrayInfo::from(address, &tick_array));
            for tick in tick_array.ticks {
                if tick.is_initialized {
                    ticks.push(TickInfo::from(&tick));
                }
            }
        }

        self.pool_info.tick_arrays = tick_arrays;
        self.pool_info.ticks = ticks;
        Ok(())
    }

    fn quote(&self, quote_params: &QuoteParams) -> Result<Quote> {
        let (a2b, fee_mint) = if self.pool_info.pool.token_a.eq(&quote_params.input_mint) {
            (true, self.pool_info.pool.token_b)
        } else {
            (false, self.pool_info.pool.token_a)
        };
        let by_amount_in = true;

        let swap_result = compute_swap(
            self.pool_info.clone(),
            a2b,
            by_amount_in,
            quote_params.in_amount,
        );

        let before_sqrt_price = SqrtPrice::new(self.pool_info.pool.current_sqrt_price);
        let before_price = if a2b {
            before_sqrt_price.ui_price(self.reserve_decimals[0], self.reserve_decimals[1])
        } else {
            before_sqrt_price.ui_price(self.reserve_decimals[1], self.reserve_decimals[0])
        };

        let after_sqrt_price = SqrtPrice::new(swap_result.next_sqrt_price);
        let after_price = if a2b {
            after_sqrt_price.ui_price(self.reserve_decimals[0], self.reserve_decimals[1])
        } else {
            after_sqrt_price.ui_price(self.reserve_decimals[1], self.reserve_decimals[0])
        };

        let not_enough_liquidity = if by_amount_in {
            swap_result.amount_in < quote_params.in_amount
        } else {
            swap_result.amount_out < quote_params.in_amount
        };

        let fee_pct = Decimal::from_f32_retain(self.fee_rate as f32).unwrap();
        let price_impact_pct = before_price
            .sub(after_price)
            .abs()
            .div(before_price)
            .mul(Decimal::from_f32_retain(100.0).unwrap());

        println!(
            "{:?}::{:?}::{:?}",
            before_price, after_price, price_impact_pct
        );
        Ok(Quote {
            not_enough_liquidity,
            min_in_amount: Option::None,
            min_out_amount: Option::None,
            in_amount: swap_result.amount_in as u64,
            out_amount: swap_result.amount_out as u64,
            fee_amount: quote_params.in_amount * (self.fee_rate as u64) / 1000000,
            fee_mint,
            fee_pct,
            price_impact_pct,
        })
    }
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use crate::{
        amm::{Amm, QuoteParams},
        crema::CremaClmm,
        harness::Harness,
        instructions::swap_with_partner::SWAP_PROGRAM_ID,
        state::clmmpool::Clmmpool,
    };
    use solana_cli_config::Config;
    use solana_client::rpc_client::RpcClient;
    use solana_sdk::commitment_config::{CommitmentConfig, CommitmentLevel};
    use solana_sdk::{pubkey, pubkey::Pubkey};

    #[test]
    fn test_quote() {
        const POOL: Pubkey = pubkey!("UiXrDgeEtrmA6rLHEMuJcn6D31qj3Noy7cDkVYKb6Tj");

        let token_a: Pubkey = pubkey!("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263");
        let token_b: Pubkey = pubkey!("So11111111111111111111111111111111111111112");

        let config = Config::load("/Users/hgamiui9/.config/solana/cli/config.yml").unwrap();
        let json_rpc_url = config.json_rpc_url.clone();
        let rpc_timeout = Duration::from_secs(200);
        let commitment = CommitmentConfig {
            commitment: CommitmentLevel::Finalized,
        };

        let confirm_transaction_initial_timeout = Duration::from_secs(10);

        let rpc_client = RpcClient::new_with_timeouts_and_commitment(
            json_rpc_url,
            rpc_timeout,
            commitment,
            confirm_transaction_initial_timeout,
        );

        // must get once tick array map date before init amm
        let tick_map_address = Clmmpool::get_tick_map_address(&POOL, &SWAP_PROGRAM_ID);
        let tick_map_data = rpc_client.get_account_data(&tick_map_address).unwrap();
        let tick_array_map = Box::new(tick_map_data);
        let harness = Harness::new(tick_array_map, 5, 9);
        let keyed_account = harness.get_keyed_accounts(POOL, 5, 9).unwrap();

        let mut amm = CremaClmm::from_keyed_account(&keyed_account).unwrap();
        harness.update_amm(&mut amm);

        let quote = amm
            .quote(&QuoteParams {
                in_amount: 6000000000000,
                input_mint: token_b,
                output_mint: token_a,
            })
            .unwrap();

        println!("quote: {:?}", quote);
    }
}
