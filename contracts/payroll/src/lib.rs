#![no_std]
#![allow(clippy::too_many_arguments)] // Fixes macro-generated arguments linting error

mod contract;
mod events;
mod storage;
mod zk_verifier;

pub use contract::*;
pub use events::*;
pub use storage::*;
pub use zk_verifier::*;

use soroban_sdk::{contracttype, Address, Bytes, BytesN, Vec};

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PayrollEmployee {
    pub address: Address,
    pub amount_usdc: i128,
    pub salary_commitment: BytesN<32>,
    pub merkle_proof: Vec<BytesN<32>>,
    pub merkle_index: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PayrollBatch {
    pub id: u64,
    pub employer: Address,
    pub total_amount: i128,
    pub employees: Vec<PayrollEmployee>,
    pub zk_proof: Bytes,
    pub public_inputs: Vec<BytesN<32>>,
    pub timestamp: u64,
    pub period_start: u64,
    pub period_end: u64,
    pub status: PayrollStatus,
    pub successful_payments: u32,
    pub failed_payments: u32,
    pub merkle_root: BytesN<32>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum PayrollStatus {
    Pending,
    Processing,
    Completed,
    Partial,
    Failed,
}

#[derive(Clone, Debug)]
#[contracttype]
pub struct PayrollConfig {
    pub employer: Address,
    pub usdc_contract: Address,
    pub zk_verifier: Address,
    pub total_batches: u64,
    pub merkle_root: BytesN<32>,
}

#[derive(Clone, Debug)]
#[contracttype]
pub struct PayrollStats {
    pub total_batches: u32,
    pub total_paid: i128,
    pub total_employees: u32,
    pub last_payroll: u64,
}
