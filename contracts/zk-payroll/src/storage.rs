use soroban_sdk::{contracttype, Address, Env};
use zk_verifier::VerificationKey;
use crate::error::PayrollError;
use crate::types::PayrollAudit;

#[contracttype]
pub enum DataKey {
    Employer,
    Verifier,
    VerificationKey,
    BatchCounter,
    Audit(u64),
    XlmToken,
    UsdcToken,
}

pub struct Storage;

impl Storage {
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

    pub fn get_verification_key(env: &Env) -> Result<VerificationKey, PayrollError> {
        env.storage()
            .instance()
            .get(&DataKey::VerificationKey)
            .ok_or(PayrollError::NotInitialized)
    }

    pub fn set_verification_key(env: &Env, vk: &VerificationKey) {
        env.storage().instance().set(&DataKey::VerificationKey, vk);
    }

    pub fn get_batch_counter(env: &Env) -> u64 {
        env.storage().instance().get(&DataKey::BatchCounter).unwrap_or(0)
    }

    pub fn set_batch_counter(env: &Env, counter: &u64) {
        env.storage().instance().set(&DataKey::BatchCounter, counter);
    }

    pub fn get_xlm_token(env: &Env) -> Result<Address, PayrollError> {
        env.storage()
            .instance()
            .get(&DataKey::XlmToken)
            .ok_or(PayrollError::TokenNotRegistered)
    }

    pub fn set_xlm_token(env: &Env, token: &Address) {
        env.storage().instance().set(&DataKey::XlmToken, token);
    }

    pub fn get_usdc_token(env: &Env) -> Result<Address, PayrollError> {
        env.storage()
            .instance()
            .get(&DataKey::UsdcToken)
            .ok_or(PayrollError::TokenNotRegistered)
    }

    pub fn set_usdc_token(env: &Env, token: &Address) {
        env.storage().instance().set(&DataKey::UsdcToken, token);
    }

    pub fn get_audit(env: &Env, batch_id: u64) -> Result<PayrollAudit, PayrollError> {
        env.storage()
            .instance()
            .get(&DataKey::Audit(batch_id))
            .ok_or(PayrollError::NotInitialized)
    }

    pub fn set_audit(env: &Env, batch_id: u64, audit: &PayrollAudit) {
        env.storage().instance().set(&DataKey::Audit(batch_id), audit);
    }

    pub fn has_employer(env: &Env) -> bool {
        env.storage().instance().has(&DataKey::Employer)
    }
}
