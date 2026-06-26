#![no_std]
#![allow(clippy::too_many_arguments)]

mod contract;
mod events;
mod storage;
mod verifier;
#[cfg(test)]
mod test;

pub use contract::*;
pub use events::*;
pub use storage::*;
pub use verifier::*;

use soroban_sdk::{contracttype, Address, Bytes, BytesN, Vec};

/// Represents a single employee within a payroll batch.
/// Contains the employee's address, payout amount, salary commitment,
/// and Merkle proof for verification against the batch root.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PayrollEmployee {
    pub address:            Address,
    pub payout_amount:      i128,
    pub salary_commitment:  BytesN<32>,
    pub merkle_proof:       Vec<BytesN<32>>,
    pub merkle_index:       u64,
}

/// Complete on-chain record of a processed payroll batch.
/// Stores all batch details including employee data, proof information,
/// payment status, and execution results.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PayrollBatch {
    pub id:                  u64,
    pub employer:            Address,
    pub total_amount:        i128,
    pub employees:           Vec<PayrollEmployee>,
    pub zk_proof:            Bytes,
    pub public_inputs:       Vec<BytesN<32>>,
    pub timestamp:           u64,
    pub period_start:        u64,
    pub period_end:          u64,
    pub status:              PayrollStatus,
    pub successful_payments: u32,
    pub failed_payments:     u32,
    pub merkle_root:         BytesN<32>,
    pub proof_binding:       BytesN<32>,
}

/// Current processing status of a payroll batch.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum PayrollStatus {
    Pending,
    Processing,
    Completed,
    Partial,
    Failed,
}

/// Contract configuration storage.
/// Contains the employer address and the token contract used for payments.
/// Verification is now inlined so no external verifier address is required.
#[derive(Clone, Debug)]
#[contracttype]
pub struct PayrollConfig {
    pub employer:        Address,
    pub token_contract:  Address,
    pub total_batches:   u64,
    pub verification_key: Bytes,
}

/// Summary statistics for an employer's payroll activity.
#[derive(Clone, Debug)]
#[contracttype]
pub struct PayrollStats {
    pub total_batches:    u32,
    pub total_paid:       i128,
    pub total_employees:  u32,
    pub last_payroll:     u64,
}
