use super::fetcher::PoolInfo;
use crate::math::{
    clmm_math::{compute_swap_step, SwapStepResult},
    tick_math::get_tick_at_sqrt_price,
};

#[derive(Debug, Clone, Copy, Default)]
pub struct StepInfo {
    pub current_tick_index: i32,
    pub current_sqrt_price: u128,
    pub target_sqrt_price: u128,
    pub after_sqrt_price: u128,
    pub start_remainer: u128,
    pub after_remainer: u128,
    pub after_tick_index: i32,
    pub amount_in: u128,
    pub amount_out: u128,
    pub fee_amount: u128,
    pub amount_used: u128,
}

impl StepInfo {
    fn from(
        remainer: u128,
        step_result: &SwapStepResult,
        current_tick_index: i32,
        current_sqrt_price: u128,
        target_sqrt_price: u128,
    ) -> Self {
        StepInfo {
            current_tick_index,
            current_sqrt_price,
            target_sqrt_price,
            after_sqrt_price: step_result.next_sqrt_price,
            start_remainer: remainer,
            after_remainer: 0,
            after_tick_index: 0i32,
            amount_in: step_result.amount_in,
            amount_out: step_result.amount_out,
            fee_amount: step_result.fee_amount,
            amount_used: 0,
        }
    }
}

#[derive(Debug, Default)]
pub struct ComputeSwapResult {
    pub amount_in: u128,
    pub amount_out: u128,
    pub fee_amount: u128,
    pub next_sqrt_price: u128,
}

impl ComputeSwapResult {
    fn update(&mut self, step_result: &SwapStepResult) {
        self.amount_in = self.amount_in.checked_add(step_result.amount_in).unwrap();
        self.amount_out = self.amount_out.checked_add(step_result.amount_out).unwrap();
        self.fee_amount = self.fee_amount.checked_add(step_result.fee_amount).unwrap();
    }
}

pub fn compute_swap(
    pool_info: PoolInfo,
    a2b: bool,
    by_amount_in: bool,
    amount: u64,
) -> ComputeSwapResult {
    let (_, ticks) = pool_info.ticks_for_swap(a2b, 100);
    let mut pool = pool_info.pool;
    let mut remainer_amount = amount as u128;
    let mut swap_result = ComputeSwapResult::default();
    let mut next_idx: usize = 0;
    let mut steps = vec![];

    while remainer_amount > 0 && next_idx < ticks.len() {
        let mut next_tick = ticks[next_idx];
        let target_sqrt_price = next_tick.sqrt_price;

        let step_result = compute_swap_step(
            pool.current_sqrt_price,
            target_sqrt_price,
            pool.liquidity,
            remainer_amount,
            pool.fee_rate,
            by_amount_in,
        )
        .unwrap();

        let mut step_info = StepInfo::from(
            remainer_amount,
            &step_result,
            pool.current_tick_index,
            pool.current_sqrt_price,
            target_sqrt_price,
        );
        if step_result.amount_in != 0 {
            match by_amount_in {
                true => {
                    remainer_amount = remainer_amount.checked_sub(step_result.amount_in).unwrap();
                    remainer_amount = remainer_amount.checked_sub(step_result.fee_amount).unwrap();
                }
                false => {
                    remainer_amount = remainer_amount.checked_sub(step_result.amount_out).unwrap();
                }
            }
            // update swap result
            swap_result.update(&step_result);
        }
        step_info.after_remainer = remainer_amount;
        step_info.amount_used = (amount as u128) - remainer_amount;

        // Cross tick
        if next_tick.is_initialized && step_result.next_sqrt_price == next_tick.sqrt_price {
            pool.current_sqrt_price = next_tick.sqrt_price;
            pool.current_tick_index = if a2b {
                next_tick.index - 1
            } else {
                next_tick.index
            };
            pool.liquidity = next_tick.cross_update(&pool, a2b);
        } else {
            pool.current_sqrt_price = step_result.next_sqrt_price;
            pool.current_tick_index = get_tick_at_sqrt_price(pool.current_sqrt_price);
        }
        step_info.after_tick_index = pool.current_tick_index;
        steps.push(step_info);

        next_idx += 1;
    }

    swap_result.amount_in += swap_result.fee_amount;
    swap_result
}
