use super::amm::{Amm, KeyedAccount};
use super::config::RPC_URL;

use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use std::collections::HashMap;

pub struct Harness {
    pub client: RpcClient,
    pub tick_array_map: Box<Vec<u8>>,
}

impl Harness {
    pub fn new(tick_array_map: Box<Vec<u8>>) -> Self {
        Self {
            client: RpcClient::new(RPC_URL),
            tick_array_map,
        }
    }

    pub fn get_keyed_accounts(&self, key: Pubkey) -> Result<KeyedAccount> {
        let account = self.client.get_account(&key)?;
        Ok(KeyedAccount {
            key,
            account,
            params: None,
            tick_array_map: self.tick_array_map.clone(),
        })
    }

    pub fn update_amm(&self, amm: &mut dyn Amm) {
        let accounts_to_update = amm.get_accounts_to_update();
        let accounts_map = self
            .client
            .get_multiple_accounts(&accounts_to_update)
            .unwrap()
            .iter()
            .enumerate()
            .fold(HashMap::new(), |mut m, (index, account)| {
                if let Some(account) = account {
                    m.insert(accounts_to_update[index], account.data.clone());
                }
                m
            });
        amm.update(&accounts_map).unwrap();
    }
}
