use soroban_sdk::{
    contracttype,
    Address,
    Env,
    BytesN,
};

use crate::{
    error::PayrollError,
    types::{PayrollRecord, PayrollRunSummary},
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Employer,
    Verifier,
    VerificationKey,
    XlmToken,
    UsdcToken,
    BatchCounter,
    PayrollBatch(u64),
    ProcessedProof(BytesN<32>),
    PayrollRun(BytesN<32>),
}

pub struct Storage;

impl Storage {
    pub fn has_employer(env: &Env) -> bool {
        env.storage().instance().has(&DataKey::Employer)
    }

    pub fn get_employer(env: &Env) -> Result<Address, PayrollError> {
        env.storage()
            .instance()
            .get(&DataKey::Employer)
            .ok_or(PayrollError::NotInitialized)
    }

    pub fn set_employer(env: &Env, employer: &Address) {
        env.storage().instance().set(&DataKey::Employer, employer);
    }

    pub fn get_verifier(env: &Env) -> Result<Address, PayrollError> {
        env.storage()
            .instance()
            .get(&DataKey::Verifier)
            .ok_or(PayrollError::NotInitialized)
    }

    pub fn set_verifier(env: &Env, verifier: &Address) {
        env.storage().instance().set(&DataKey::Verifier, verifier);
    }

    pub fn set_verification_key(env: &Env, vk: &zetapay_verifier::VerificationKey) {
        env.storage().instance().set(&DataKey::VerificationKey, vk);
    }

    pub fn get_verification_key(env: &Env) -> Result<zetapay_verifier::VerificationKey, PayrollError> {
        env.storage()
            .instance()
            .get(&DataKey::VerificationKey)
            .ok_or(PayrollError::NotInitialized)
    }

    pub fn set_xlm_token(env: &Env, token: &Address) {
        env.storage().instance().set(&DataKey::XlmToken, token);
    }

    pub fn get_xlm_token(env: &Env) -> Result<Address, PayrollError> {
        env.storage()
            .instance()
            .get(&DataKey::XlmToken)
            .ok_or(PayrollError::TokenNotRegistered)
    }

    pub fn set_usdc_token(env: &Env, token: &Address) {
        env.storage().instance().set(&DataKey::UsdcToken, token);
    }

    pub fn get_usdc_token(env: &Env) -> Result<Address, PayrollError> {
        env.storage()
            .instance()
            .get(&DataKey::UsdcToken)
            .ok_or(PayrollError::TokenNotRegistered)
    }

    pub fn get_batch_counter(env: &Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::BatchCounter)
            .unwrap_or(0)
    }

    pub fn set_batch_counter(env: &Env, value: &u64) {
        env.storage().instance().set(&DataKey::BatchCounter, value);
    }

    pub fn set_payroll_record(env: &Env, id: u64, record: &PayrollRecord) {
        env.storage()
            .persistent()
            .set(&DataKey::PayrollBatch(id), record);
    }

    pub fn get_payroll_record(env: &Env, id: u64) -> Result<PayrollRecord, PayrollError> {
        env.storage()
            .persistent()
            .get(&DataKey::PayrollBatch(id))
            .ok_or(PayrollError::NotInitialized)
    }

    pub fn is_proof_processed(env: &Env, proof_hash: &BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::ProcessedProof(proof_hash.clone()))
    }

    pub fn mark_proof_processed(env: &Env, proof_hash: &BytesN<32>) {
        env.storage()
            .persistent()
            .set(&DataKey::ProcessedProof(proof_hash.clone()), &true);
    }

    pub fn set_payroll_run_summary(
        env: &Env,
        payroll_run_hash: &BytesN<32>,
        summary: &PayrollRunSummary,
    ) {
        env.storage()
            .persistent()
            .set(&DataKey::PayrollRun(payroll_run_hash.clone()), summary);
    }
    
    pub fn get_payroll_run_summary(
        env: &Env,
        payroll_run_hash: &BytesN<32>,
    ) -> Option<PayrollRunSummary> {
        env.storage()
            .persistent()
            .get(&DataKey::PayrollRun(payroll_run_hash.clone()))
    }
}