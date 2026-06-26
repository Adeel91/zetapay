use crate::{
    events, storage, verifier, PayrollBatch, PayrollConfig, PayrollEmployee, PayrollStats,
    PayrollStatus,
};
use soroban_sdk::{contract, contractimpl, token, Address, Bytes, BytesN, Env, Vec};

#[contract]
pub struct PayrollContract;

#[contractimpl]
impl PayrollContract {
    // -----------------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------------

    /// Deploy and configure the contract.
    pub fn initialize(env: Env, employer: Address, token_contract: Address, verification_key: Bytes) -> u64 {
        employer.require_auth();

        if storage::get_config(&env).is_some() {
            panic!("already_initialized");
        }

        let config = PayrollConfig {
            employer: employer.clone(),
            token_contract,
            total_batches: 0,
            verification_key,
        };
        storage::set_config(&env, &config);
        events::contract_initialized(&env, &employer);

        config.total_batches
    }

    // -----------------------------------------------------------------------
    // Core payroll execution
    // -----------------------------------------------------------------------

    /// Execute a payroll batch with ZK proof verification.
    pub fn submit_batch(
        env:           Env,
        employer:      Address,
        employees:     Vec<PayrollEmployee>,
        zk_proof:      Bytes,
        public_inputs: Vec<BytesN<32>>,
        total_amount:  i128,
        period_start:  u64,
        period_end:    u64,
        merkle_root:   BytesN<32>,
    ) -> u64 {
        employer.require_auth();

        if employees.is_empty() {
            panic!("no_employees");
        }

        if total_amount <= 0 {
            panic!("non_positive_amount");
        }

        let config = storage::get_config(&env).unwrap_or_else(|| panic!("not_initialized"));

        // Verify ZK proof using Protocol 26 BN254 host functions
        let (proof_valid, proof_binding) = verifier::verify_batch_proof(
            &env,
            &employees,
            &zk_proof,
            &public_inputs,
            total_amount,
            &merkle_root,
            &config.verification_key,
        );

        if !proof_valid {
            let next_id = storage::get_batch_count(&env) + 1;
            events::zk_verification_failed(&env, next_id);
            panic!("invalid_proof");
        }

        // Transfer total amount from employer to contract
        let token           = token::Client::new(&env, &config.token_contract);
        let contract_addr   = env.current_contract_address();

        token.transfer(&employer, &contract_addr, &total_amount);

        let batch_id         = storage::get_batch_count(&env) + 1;
        let employee_count   = employees.len();
        let mut successful   = 0u32;

        // Distribute payments to each employee
        for i in 0..employee_count {
            let emp = employees.get(i).unwrap();
            token.transfer(&contract_addr, &emp.address, &emp.payout_amount);
            successful += 1;
            events::payment_executed(&env, &emp.address, emp.payout_amount, batch_id);
        }

        let status = if successful == employee_count {
            PayrollStatus::Completed
        } else if successful > 0 {
            PayrollStatus::Partial
        } else {
            PayrollStatus::Failed
        };

        // Store batch record
        let batch = PayrollBatch {
            id:                  batch_id,
            employer:            employer.clone(),
            total_amount,
            employees,
            zk_proof,
            public_inputs,
            timestamp:           env.ledger().timestamp(),
            period_start,
            period_end,
            status,
            successful_payments: successful,
            failed_payments:     employee_count - successful,
            merkle_root,
            proof_binding,
        };

        storage::store_batch(&env, &batch);
        storage::increment_batch_count(&env);
        storage::append_employer_batch(&env, &employer, batch_id);

        events::batch_processed(&env, batch_id, &employer, successful, employee_count);

        batch_id
    }

    // -----------------------------------------------------------------------
    // Read-only accessors
    // -----------------------------------------------------------------------

    pub fn get_batch(env: Env, batch_id: u64) -> Option<PayrollBatch> {
        storage::get_batch(&env, batch_id)
    }

    pub fn get_employer_batches(env: Env, employer: Address) -> Vec<PayrollBatch> {
        storage::get_employer_batches(&env, &employer)
    }

    pub fn get_stats(env: Env, employer: Address) -> PayrollStats {
        let batches = storage::get_employer_batches(&env, &employer);
        let mut total_paid:      i128 = 0;
        let mut total_employees: u32  = 0;
        let mut last_payroll:    u64  = 0;

        for i in 0..batches.len() {
            let batch = batches.get(i).unwrap();
            match batch.status {
                PayrollStatus::Completed | PayrollStatus::Partial => {
                    total_paid      += batch.total_amount;
                    total_employees += batch.successful_payments;
                }
                _ => {}
            }
            if batch.timestamp > last_payroll {
                last_payroll = batch.timestamp;
            }
        }

        PayrollStats {
            total_batches:   batches.len(),
            total_paid,
            total_employees,
            last_payroll,
        }
    }
}
