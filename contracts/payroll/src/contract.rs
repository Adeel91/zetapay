use crate::{
    events, storage, zk_verifier, PayrollBatch, PayrollConfig, PayrollEmployee, PayrollStats,
    PayrollStatus,
};
use soroban_sdk::{contract, contractimpl, token, Address, Bytes, BytesN, Env, Vec};

#[contract]
pub struct PayrollContract;

#[contractimpl]
impl PayrollContract {
    pub fn initialize(
        env: Env,
        employer: Address,
        usdc_contract: Address,
        zk_verifier: Address,
        merkle_root: BytesN<32>,
    ) -> u64 {
        employer.require_auth();

        if storage::get_config(&env).is_some() {
            panic!("Contract already initialized");
        }

        let config = PayrollConfig {
            employer: employer.clone(),
            usdc_contract: usdc_contract.clone(),
            zk_verifier: zk_verifier.clone(),
            total_batches: 0,
            merkle_root,
        };
        storage::set_config(&env, &config);
        events::contract_initialized(&env, &employer);

        config.total_batches
    }

    pub fn submit_batch(
        env: Env,
        employer: Address,
        employees: Vec<PayrollEmployee>,
        zk_proof: Bytes, // Real data payload
        public_inputs: Vec<BytesN<32>>,
        total_amount: i128,
        period_start: u64,
        period_end: u64,
        merkle_root: BytesN<32>,
    ) -> u64 {
        employer.require_auth();

        if employees.is_empty() {
            panic!("No employees provided");
        }

        if total_amount <= 0 {
            panic!("Total amount must be greater than 0");
        }

        let config = storage::get_config(&env).unwrap_or_else(|| {
            panic!("Contract not initialized");
        });

        if merkle_root != config.merkle_root {
            panic!("Merkle root does not match");
        }

        let verifier = config.zk_verifier.clone();

        let proof_valid = zk_verifier::verify_batch_proof(
            &env,
            &verifier,
            &employees,
            &zk_proof,
            &public_inputs,
            total_amount,
            merkle_root.clone(),
        );

        if !proof_valid {
            events::zk_verification_failed(&env, 0);
            panic!("Invalid ZK proof");
        }

        let usdc = token::Client::new(&env, &config.usdc_contract);
        let contract_address = env.current_contract_address();

        usdc.transfer(&employer, &contract_address, &total_amount);

        let batch_id = storage::get_batch_count(&env) + 1;
        let mut successful = 0;
        let total_employees_count = employees.len();

        for i in 0..total_employees_count {
            let employee = employees.get(i).unwrap();

            usdc.transfer(&contract_address, &employee.address, &employee.amount_usdc);

            successful += 1;
            events::payment_executed(&env, &employee.address, employee.amount_usdc, batch_id);
        }

        let status = if successful == total_employees_count {
            PayrollStatus::Completed
        } else if successful > 0 {
            PayrollStatus::Partial
        } else {
            PayrollStatus::Failed
        };

        let batch = PayrollBatch {
            id: batch_id,
            employer: employer.clone(),
            total_amount,
            employees,
            zk_proof,
            public_inputs,
            timestamp: env.ledger().timestamp(),
            period_start,
            period_end,
            status,
            successful_payments: successful,
            failed_payments: total_employees_count - successful,
            merkle_root,
        };

        storage::store_batch(&env, &batch);
        storage::increment_batch_count(&env);
        events::batch_processed(&env, batch_id, &employer, successful, total_employees_count);

        batch_id
    }

    pub fn get_batch(env: Env, batch_id: u64) -> Option<PayrollBatch> {
        storage::get_batch(&env, batch_id)
    }

    pub fn get_employer_batches(env: Env, employer: Address) -> Vec<PayrollBatch> {
        storage::get_employer_batches(&env, &employer)
    }

    pub fn get_stats(env: Env, employer: Address) -> PayrollStats {
        let batches = storage::get_employer_batches(&env, &employer);
        let mut total_paid = 0;
        let mut total_employees = 0;
        let mut last_payroll = 0;

        for i in 0..batches.len() {
            let batch = batches.get(i).unwrap();
            if batch.status == PayrollStatus::Completed || batch.status == PayrollStatus::Partial {
                total_paid += batch.total_amount;
                total_employees += batch.successful_payments;
            }
            if batch.timestamp > last_payroll {
                last_payroll = batch.timestamp;
            }
        }

        PayrollStats {
            total_batches: batches.len(),
            total_paid,
            total_employees,
            last_payroll,
        }
    }

    pub fn retry_failed_payments(
        env: Env,
        employer: Address,
        batch_id: u64,
        failed_employees: Vec<PayrollEmployee>,
    ) -> bool {
        employer.require_auth();

        let mut batch = storage::get_batch(&env, batch_id).unwrap_or_else(|| {
            panic!("Batch not found");
        });

        if batch.status != PayrollStatus::Partial && batch.status != PayrollStatus::Failed {
            panic!("Batch cannot be retried");
        }

        let config = storage::get_config(&env).unwrap();
        let usdc = token::Client::new(&env, &config.usdc_contract);
        let contract_address = env.current_contract_address();

        let mut retry_success = 0;
        let failed_count = failed_employees.len();

        for i in 0..failed_count {
            let employee = failed_employees.get(i).unwrap();

            usdc.transfer(&contract_address, &employee.address, &employee.amount_usdc);

            retry_success += 1;
            events::payment_executed(&env, &employee.address, employee.amount_usdc, batch_id);
        }

        batch.successful_payments += retry_success;
        batch.failed_payments -= retry_success;

        if batch.failed_payments == 0 {
            batch.status = PayrollStatus::Completed;
        }

        storage::store_batch(&env, &batch);
        events::batch_retried(&env, batch_id, retry_success, failed_count);

        true
    }
}
