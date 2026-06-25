use crate::{PayrollBatch, PayrollConfig};
use soroban_sdk::{symbol_short, Address, Env, Symbol, Vec};

const CONFIG_KEY: Symbol = symbol_short!("config");
const BATCH_COUNT_KEY: Symbol = symbol_short!("btch_cnt");

pub fn set_config(env: &Env, config: &PayrollConfig) {
    env.storage().persistent().set(&CONFIG_KEY, config);
}

pub fn get_config(env: &Env) -> Option<PayrollConfig> {
    env.storage().persistent().get(&CONFIG_KEY)
}

pub fn store_batch(env: &Env, batch: &PayrollBatch) {
    let key = batch.id;
    env.storage().persistent().set(&key, batch);

    let employer_key = batch.employer.clone();
    let mut batches: Vec<PayrollBatch> = env
        .storage()
        .persistent()
        .get(&employer_key)
        .unwrap_or_else(|| Vec::new(env));

    let mut found = false;
    let total_batches = batches.len();

    for i in 0..total_batches {
        let existing = batches.get(i).unwrap();
        if existing.id == batch.id {
            batches.set(i, batch.clone());
            found = true;
            break;
        }
    }
    if !found {
        batches.push_back(batch.clone());
    }

    env.storage().persistent().set(&employer_key, &batches);
}

pub fn get_batch(env: &Env, batch_id: u64) -> Option<PayrollBatch> {
    env.storage().persistent().get(&batch_id)
}

pub fn get_employer_batches(env: &Env, employer: &Address) -> Vec<PayrollBatch> {
    env.storage()
        .persistent()
        .get(employer)
        .unwrap_or_else(|| Vec::new(env))
}

pub fn get_batch_count(env: &Env) -> u64 {
    env.storage()
        .persistent()
        .get(&BATCH_COUNT_KEY)
        .unwrap_or(0)
}

pub fn increment_batch_count(env: &Env) {
    let count = get_batch_count(env) + 1;
    env.storage().persistent().set(&BATCH_COUNT_KEY, &count);
}
