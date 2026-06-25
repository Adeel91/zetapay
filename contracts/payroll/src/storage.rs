// ✅ Protocol 26: TTL management
use soroban_sdk::{Env, Vec, Address};
use crate::{PayrollConfig, PayrollBatch};

const CONFIG_KEY: &[u8] = b"config";
const BATCH_COUNT_KEY: &[u8] = b"batch_count";

// ✅ Protocol 26: TTL constants
const TTL_THRESHOLD: u32 = 10; // 10 ledgers
const TTL_EXTEND_TO: u32 = 100; // 100 ledgers

pub fn set_config(env: &Env, config: &PayrollConfig) {
    env.storage().persistent().set(&CONFIG_KEY, config);
    // ✅ Protocol 26: Extend TTL
    env.storage().persistent().extend_ttl(&CONFIG_KEY, TTL_THRESHOLD, TTL_EXTEND_TO);
}

pub fn get_config(env: &Env) -> Option<PayrollConfig> {
    env.storage().persistent().get(&CONFIG_KEY)
}

pub fn store_batch(env: &Env, batch: &PayrollBatch) {
    env.storage().persistent().set(&batch.id, batch);
    // ✅ Protocol 26: Extend TTL
    env.storage().persistent().extend_ttl(&batch.id, TTL_THRESHOLD, TTL_EXTEND_TO);
}

pub fn get_batch(env: &Env, batch_id: u64) -> Option<PayrollBatch> {
    env.storage().persistent().get(&batch_id)
}

pub fn get_employer_batches(env: &Env, employer: &Address) -> Vec<PayrollBatch> {
    Vec::new(env)
}

pub fn get_batch_count(env: &Env) -> u64 {
    env.storage().persistent().get(&BATCH_COUNT_KEY).unwrap_or(0)
}

pub fn increment_batch_count(env: &Env) {
    let count = get_batch_count(env) + 1;
    env.storage().persistent().set(&BATCH_COUNT_KEY, &count);
    // ✅ Protocol 26: Extend TTL
    env.storage().persistent().extend_ttl(&BATCH_COUNT_KEY, TTL_THRESHOLD, TTL_EXTEND_TO);
}

// ✅ Protocol 26: Utility function to extend TTL for any key
pub fn extend_ttl(env: &Env, key: &[u8], threshold: u32, extend_to: u32) {
    env.storage().persistent().extend_ttl(key, threshold, extend_to);
}