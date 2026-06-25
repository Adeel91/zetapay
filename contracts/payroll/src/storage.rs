use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::{PayrollBatch, PayrollConfig};

// ---------------------------------------------------------------------------
// Storage key enum — type-safe, clash-free key space.
// ---------------------------------------------------------------------------

#[contracttype]
enum StorageKey {
    Config,
    BatchCount,
    Batch(u64),
    EmployerBatchIds(Address),
}

// ---------------------------------------------------------------------------
// TTL constants (ledger-based)
// 1 ledger ≈ 5 seconds on Stellar network
// Config and batch records should survive at least one year of payroll cycles
// ~1 year ≈ 6,311,520 ledgers
// Trigger extension when ≤ 30 days remain (≈ 518,400 ledgers)
// ---------------------------------------------------------------------------
const TTL_THRESHOLD: u32 = 518_400;   // ~30 days
const TTL_EXTEND_TO: u32 = 6_311_520; // ~1 year

// ---------------------------------------------------------------------------
// Config storage operations
// ---------------------------------------------------------------------------

pub fn set_config(env: &Env, config: &PayrollConfig) {
    env.storage().persistent().set(&StorageKey::Config, config);
    env.storage()
        .persistent()
        .extend_ttl(&StorageKey::Config, TTL_THRESHOLD, TTL_EXTEND_TO);
}

pub fn get_config(env: &Env) -> Option<PayrollConfig> {
    if let Some(config) = env.storage().persistent().get::<StorageKey, PayrollConfig>(&StorageKey::Config) {
        env.storage()
            .persistent()
            .extend_ttl(&StorageKey::Config, TTL_THRESHOLD, TTL_EXTEND_TO);
        Some(config)
    } else {
        None
    }
}

// ---------------------------------------------------------------------------
// Batch counter (monotonic ID generator)
// ---------------------------------------------------------------------------

pub fn get_batch_count(env: &Env) -> u64 {
    env.storage()
        .persistent()
        .get::<StorageKey, u64>(&StorageKey::BatchCount)
        .unwrap_or(0)
}

pub fn increment_batch_count(env: &Env) {
    let next = get_batch_count(env) + 1;
    env.storage()
        .persistent()
        .set(&StorageKey::BatchCount, &next);
    env.storage()
        .persistent()
        .extend_ttl(&StorageKey::BatchCount, TTL_THRESHOLD, TTL_EXTEND_TO);
}

// ---------------------------------------------------------------------------
// Batch record storage operations
// ---------------------------------------------------------------------------

pub fn store_batch(env: &Env, batch: &PayrollBatch) {
    env.storage()
        .persistent()
        .set(&StorageKey::Batch(batch.id), batch);
    env.storage()
        .persistent()
        .extend_ttl(&StorageKey::Batch(batch.id), TTL_THRESHOLD, TTL_EXTEND_TO);
}

pub fn get_batch(env: &Env, batch_id: u64) -> Option<PayrollBatch> {
    if let Some(batch) = env
        .storage()
        .persistent()
        .get::<StorageKey, PayrollBatch>(&StorageKey::Batch(batch_id))
    {
        env.storage()
            .persistent()
            .extend_ttl(&StorageKey::Batch(batch_id), TTL_THRESHOLD, TTL_EXTEND_TO);
        Some(batch)
    } else {
        None
    }
}

// ---------------------------------------------------------------------------
// Per-employer batch index operations
// ---------------------------------------------------------------------------

pub fn append_employer_batch(env: &Env, employer: &Address, batch_id: u64) {
    let key = StorageKey::EmployerBatchIds(employer.clone());
    let mut ids: Vec<u64> = env
        .storage()
        .persistent()
        .get::<StorageKey, Vec<u64>>(&key)
        .unwrap_or_else(|| Vec::new(env));
    ids.push_back(batch_id);
    env.storage().persistent().set(&key, &ids);
    env.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

pub fn get_employer_batches(env: &Env, employer: &Address) -> Vec<PayrollBatch> {
    let key = StorageKey::EmployerBatchIds(employer.clone());
    let ids: Vec<u64> = env
        .storage()
        .persistent()
        .get::<StorageKey, Vec<u64>>(&key)
        .unwrap_or_else(|| Vec::new(env));

    let mut batches: Vec<PayrollBatch> = Vec::new(env);
    for i in 0..ids.len() {
        let id = ids.get(i).unwrap();
        if let Some(batch) = get_batch(env, id) {
            batches.push_back(batch);
        }
    }
    batches
}
