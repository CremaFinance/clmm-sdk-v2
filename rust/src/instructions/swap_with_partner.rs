use borsh::{BorshDeserialize, BorshSerialize};
use solana_client::rpc_client::RpcClient;
use solana_program::instruction::{AccountMeta, Instruction};
use solana_sdk::{pubkey, pubkey::Pubkey};
use std::vec;

use crate::state::clmmpool::Clmmpool;
use crate::state::tick_array::TickArray;
use crate::state::tick_array_map::TickArrayMap;
use crate::utils::sighash;

pub const SWAP_PROGRAM_ID: Pubkey = pubkey!("CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR");

#[derive(BorshSerialize, BorshDeserialize, Eq, PartialEq, Debug, Clone)]
pub struct SwapWithPartnerArgs {
    a_to_b: bool,
    by_amount_in: bool,
    amount: u64,
    amount_limit: u64,
    sqrt_price_limit: u128,
}

#[allow(clippy::too_many_arguments)]
pub fn new_swap_with_partner(
    rpc_client: &RpcClient,
    clmm_config: &Pubkey,
    clmmpool: &Pubkey,
    token_a: &Pubkey,
    token_b: &Pubkey,
    account_a: &Pubkey,
    account_b: &Pubkey,
    token_a_vault: &Pubkey,
    token_b_vault: &Pubkey,
    tick_array_map: &Pubkey,
    partner: &Pubkey,
    partner_ata_a: &Pubkey,
    partner_ata_b: &Pubkey,
    a_to_b: bool,
    amount: u64,
    amount_limit: u64,
    sqrt_price_limit: u128,
    by_amount_in: bool,
    payer: Pubkey,
) -> Instruction {
    let data = &SwapWithPartnerArgs {
        a_to_b,
        by_amount_in,
        amount,
        amount_limit,
        sqrt_price_limit,
    };

    let mut dsa = data.try_to_vec().unwrap();
    let mut distor = sighash::sighash("global", "swap_with_partner").to_vec();
    distor.append(&mut dsa);

    let data = rpc_client.get_account_data(clmmpool).unwrap();
    let clmmpool_info: Clmmpool = Clmmpool::try_from_slice(&data[8..]).unwrap();
    let tick_map_address = Clmmpool::get_tick_map_address(clmmpool, &SWAP_PROGRAM_ID);
    let tick_map_data = rpc_client.get_account_data(&tick_map_address).unwrap();
    let array_map: TickArrayMap = TickArrayMap::try_from_slice(&tick_map_data[8..]).unwrap();
    let mut remaining_accounts: Vec<AccountMeta> = vec![];
    let pool_array_index =
        TickArray::array_index(clmmpool_info.current_tick_index, clmmpool_info.tick_spacing);
    let mut expect_array_index = if array_map.is_seted(pool_array_index.into()) {
        pool_array_index
    } else {
        array_map
            .next_seted(pool_array_index.into(), a_to_b)
            .unwrap() as u16
    };

    for _ in 0..3 {
        let array_adderss =
            TickArray::find_address(clmmpool, expect_array_index as u16, &SWAP_PROGRAM_ID);

        remaining_accounts.push(AccountMeta::new(array_adderss, false));
        let next_idx = array_map.next_seted(expect_array_index.into(), a_to_b);
        if let Some(next_ix) = next_idx {
            expect_array_index = next_ix as u16;
        } else {
            break;
        }
    }
    println!("remaing accounts len:{}", remaining_accounts.len());
    let mut accounts = vec![
        AccountMeta::new_readonly(*clmm_config, false),
        AccountMeta::new(*clmmpool, false),
        AccountMeta::new_readonly(*token_a, false),
        AccountMeta::new_readonly(*token_b, false),
        AccountMeta::new(*account_a, false),
        AccountMeta::new(*account_b, false),
        AccountMeta::new(*token_a_vault, false),
        AccountMeta::new(*token_b_vault, false),
        AccountMeta::new(*tick_array_map, false),
        AccountMeta::new(payer, true),
        AccountMeta::new_readonly(*partner, false),
        AccountMeta::new(*partner_ata_a, false),
        AccountMeta::new(*partner_ata_b, false),
        AccountMeta::new_readonly(spl_token::id(), false),
    ];
    accounts.extend(remaining_accounts);
    Instruction {
        program_id: SWAP_PROGRAM_ID,
        accounts,
        data: distor,
    }
}
