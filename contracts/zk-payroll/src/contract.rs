use soroban_sdk::{
    contract, contractimpl, crypto::bn254::Bn254Fr, token, Address, Bytes, BytesN, Env, Vec,
};

use crate::{
    error::PayrollError,
    storage::Storage,
    types::{
        PayeeType, PayrollBatch, PayrollPayment, PayrollRecord, PayrollRunSummary, Token,
    },
};

use zk_verifier::{Proof, ZkVerifierClient};

#[contract]
pub struct ZkPayroll;

#[contractimpl]
impl ZkPayroll {
    pub fn initialize(
        env: Env,
        employer: Address,
        verifier: Address,
        xlm_token: Address,
        usdc_token: Address,
        vk: zk_verifier::VerificationKey,
    ) -> Result<(), PayrollError> {
        employer.require_auth();

        if Storage::has_employer(&env) {
            return Err(PayrollError::AlreadyInitialized);
        }

        Storage::set_employer(&env, &employer);
        Storage::set_verifier(&env, &verifier);
        Storage::set_xlm_token(&env, &xlm_token);
        Storage::set_usdc_token(&env, &usdc_token);
        Storage::set_verification_key(&env, &vk);
        Storage::set_batch_counter(&env, &0);

        Ok(())
    }

    pub fn submit_batch(
        env: Env,
        payments: Vec<PayrollPayment>,
        proof: Proof,
        public_inputs: Vec<Bn254Fr>,
        payroll_run_hash: BytesN<32>,
        payroll_run_hash_field: u64,
        period_id: u64,
        batch_index: u32,
        batch_count: u32,
        commitment_root: BytesN<32>,
    ) -> Result<u64, PayrollError> {
        let employer = Storage::get_employer(&env)?;
        employer.require_auth();

        if payments.is_empty() {
            return Err(PayrollError::InvalidPayeeCount);
        }

        let proof_hash = Self::proof_hash(&env, &public_inputs, &payroll_run_hash);

        if Storage::is_proof_processed(&env, &proof_hash) {
            return Err(PayrollError::InvalidProof);
        }

        let verifier = Storage::get_verifier(&env)?;
        let vk = Storage::get_verification_key(&env)?;
        let verifier_client = ZkVerifierClient::new(&env, &verifier);

        let verified = verifier_client
            .try_verify(&vk, &proof, &public_inputs)
            .map_err(|_| PayrollError::VerifierError)?
            .map_err(|_| PayrollError::VerifierError)?;

        if !verified {
            return Err(PayrollError::InvalidProof);
        }

        let totals = Self::parse_public_totals(&public_inputs)?;

        if totals.payee_count_total != payments.len() {
            return Err(PayrollError::InvalidPayeeCount);
        }

        Self::verify_payments_against_totals(&payments, &totals)?;

        if totals.period_id != period_id
            || totals._payroll_run_hash != payroll_run_hash_field
            || totals.batch_index != batch_index
            || totals.batch_count != batch_count
        {
            return Err(PayrollError::InvalidTotals);
        }

        let batch_id = Storage::get_batch_counter(&env) + 1;

        let batch = PayrollBatch {
            payroll_run_hash,
            period_id,
            batch_index,
            batch_count,
            proof_hash: proof_hash.clone(),
            commitment_root,
            payment_count: payments.len(),
            total_amount: totals.total_amount,
            total_xlm: totals.total_xlm,
            total_usdc: totals.total_usdc,
            is_executed: false,
        };

        let record = PayrollRecord { batch, payments };

        Storage::set_payroll_record(&env, batch_id, &record);
        Storage::set_batch_counter(&env, &batch_id);
        Storage::mark_proof_processed(&env, &proof_hash);

        Self::update_run_on_submit(
            &env,
            &record.batch.payroll_run_hash,
            record.batch.period_id,
            record.batch.batch_count,
            record.batch.total_amount,
            record.batch.total_xlm,
            record.batch.total_usdc,
        );

        Ok(batch_id)
    }

    pub fn execute_batch(env: Env, batch_id: u64) -> Result<(), PayrollError> {
        let employer = Storage::get_employer(&env)?;
        employer.require_auth();

        let mut record = Storage::get_payroll_record(&env, batch_id)?;

        if record.batch.is_executed {
            return Err(PayrollError::AlreadyExecuted);
        }

        let xlm_token = Storage::get_xlm_token(&env)?;
        let usdc_token = Storage::get_usdc_token(&env)?;

        for payment in record.payments.iter() {
            match payment.token {
                Token::XLM => {
                    token::TokenClient::new(&env, &xlm_token).transfer(
                        &employer,
                        &payment.recipient,
                        &payment.amount,
                    );
                }
                Token::USDC => {
                    token::TokenClient::new(&env, &usdc_token).transfer(
                        &employer,
                        &payment.recipient,
                        &payment.amount,
                    );
                }
            }
        }

        record.batch.is_executed = true;
        Storage::set_payroll_record(&env, batch_id, &record);

        Self::update_run_on_execute(&env, &record.batch.payroll_run_hash);

        Ok(())
    }

    pub fn get_batch_count(env: Env) -> u64 {
        Storage::get_batch_counter(&env)
    }

    pub fn get_payroll_record(env: Env, batch_id: u64) -> Result<PayrollRecord, PayrollError> {
        Storage::get_payroll_record(&env, batch_id)
    }

    pub fn get_payroll_run_summary(
        env: Env,
        payroll_run_hash: BytesN<32>,
    ) -> Option<PayrollRunSummary> {
        Storage::get_payroll_run_summary(&env, &payroll_run_hash)
    }

    fn proof_hash(
        env: &Env,
        public_inputs: &Vec<Bn254Fr>,
        payroll_run_hash: &BytesN<32>,
    ) -> BytesN<32> {
        let mut bytes = Bytes::new(env);

        for input in public_inputs.iter() {
            let input_bytes = input.to_u256().to_be_bytes();
            bytes.append(&input_bytes);
        }

        bytes.append(&Bytes::from_array(env, &payroll_run_hash.to_array()));

        env.crypto().sha256(&bytes).into()
    }

    fn parse_public_totals(public_inputs: &Vec<Bn254Fr>) -> Result<PublicTotals, PayrollError> {
        Ok(PublicTotals {
            total_amount: Self::parse_i128(public_inputs, 10)?,
            total_xlm: Self::parse_i128(public_inputs, 11)?,
            total_usdc: Self::parse_i128(public_inputs, 12)?,
            employee_total: Self::parse_i128(public_inputs, 13)?,
            contractor_total: Self::parse_i128(public_inputs, 14)?,
            freelancer_total: Self::parse_i128(public_inputs, 15)?,
            vendor_total: Self::parse_i128(public_inputs, 16)?,
            consultant_total: Self::parse_i128(public_inputs, 17)?,
            contributor_total: Self::parse_i128(public_inputs, 18)?,
            employee_count: Self::parse_u32(public_inputs, 19)?,
            contractor_count: Self::parse_u32(public_inputs, 20)?,
            freelancer_count: Self::parse_u32(public_inputs, 21)?,
            vendor_count: Self::parse_u32(public_inputs, 22)?,
            consultant_count: Self::parse_u32(public_inputs, 23)?,
            contributor_count: Self::parse_u32(public_inputs, 24)?,
            period_id: Self::parse_u64(public_inputs, 25)?,
            _payroll_run_hash: Self::parse_u64(public_inputs, 26)?,
            batch_index: Self::parse_u32(public_inputs, 27)?,
            batch_count: Self::parse_u32(public_inputs, 28)?,
            payee_count_total: Self::parse_u32(public_inputs, 29)?,
        })
    }

    fn update_run_on_submit(
        env: &Env,
        payroll_run_hash: &BytesN<32>,
        period_id: u64,
        batch_count: u32,
        total_amount: i128,
        total_xlm: i128,
        total_usdc: i128,
    ) {
        let mut summary =
            Storage::get_payroll_run_summary(env, payroll_run_hash).unwrap_or(PayrollRunSummary {
                payroll_run_hash: payroll_run_hash.clone(),
                period_id,
                batch_count,
                submitted_batches: 0,
                executed_batches: 0,
                total_amount: 0,
                total_xlm: 0,
                total_usdc: 0,
                is_complete: false,
                is_fully_executed: false,
            });

        summary.submitted_batches += 1;
        summary.total_amount += total_amount;
        summary.total_xlm += total_xlm;
        summary.total_usdc += total_usdc;
        summary.is_complete = summary.submitted_batches == summary.batch_count;
        summary.is_fully_executed =
            summary.is_complete && summary.executed_batches == summary.batch_count;

        Storage::set_payroll_run_summary(env, payroll_run_hash, &summary);
    }

    fn update_run_on_execute(env: &Env, payroll_run_hash: &BytesN<32>) {
        if let Some(mut summary) = Storage::get_payroll_run_summary(env, payroll_run_hash) {
            summary.executed_batches += 1;
            summary.is_fully_executed =
                summary.is_complete && summary.executed_batches == summary.batch_count;

            Storage::set_payroll_run_summary(env, payroll_run_hash, &summary);
        }
    }

    fn verify_payments_against_totals(
        payments: &Vec<PayrollPayment>,
        totals: &PublicTotals,
    ) -> Result<(), PayrollError> {
        let mut total_amount: i128 = 0;
        let mut total_xlm: i128 = 0;
        let mut total_usdc: i128 = 0;

        let mut employee_total: i128 = 0;
        let mut contractor_total: i128 = 0;
        let mut freelancer_total: i128 = 0;
        let mut vendor_total: i128 = 0;
        let mut consultant_total: i128 = 0;
        let mut contributor_total: i128 = 0;

        let mut employee_count: u32 = 0;
        let mut contractor_count: u32 = 0;
        let mut freelancer_count: u32 = 0;
        let mut vendor_count: u32 = 0;
        let mut consultant_count: u32 = 0;
        let mut contributor_count: u32 = 0;

        for payment in payments.iter() {
            if payment.amount <= 0 {
                return Err(PayrollError::InvalidTotals);
            }

            total_amount += payment.amount;

            match payment.token {
                Token::XLM => total_xlm += payment.amount,
                Token::USDC => total_usdc += payment.amount,
            }

            match payment.payee_type {
                PayeeType::Employee => {
                    employee_total += payment.amount;
                    employee_count += 1;
                }
                PayeeType::Contractor => {
                    contractor_total += payment.amount;
                    contractor_count += 1;
                }
                PayeeType::Freelancer => {
                    freelancer_total += payment.amount;
                    freelancer_count += 1;
                }
                PayeeType::Vendor => {
                    vendor_total += payment.amount;
                    vendor_count += 1;
                }
                PayeeType::Consultant => {
                    consultant_total += payment.amount;
                    consultant_count += 1;
                }
                PayeeType::Contributor => {
                    contributor_total += payment.amount;
                    contributor_count += 1;
                }
            }
        }

        if total_amount != totals.total_amount
            || total_xlm != totals.total_xlm
            || total_usdc != totals.total_usdc
            || employee_total != totals.employee_total
            || contractor_total != totals.contractor_total
            || freelancer_total != totals.freelancer_total
            || vendor_total != totals.vendor_total
            || consultant_total != totals.consultant_total
            || contributor_total != totals.contributor_total
            || employee_count != totals.employee_count
            || contractor_count != totals.contractor_count
            || freelancer_count != totals.freelancer_count
            || vendor_count != totals.vendor_count
            || consultant_count != totals.consultant_count
            || contributor_count != totals.contributor_count
        {
            return Err(PayrollError::InvalidTotals);
        }

        Ok(())
    }

    fn parse_i128(inputs: &Vec<Bn254Fr>, idx: u32) -> Result<i128, PayrollError> {
        let value = inputs
            .get(idx)
            .ok_or(PayrollError::InvalidTotals)?
            .to_u256()
            .to_u128()
            .ok_or(PayrollError::InvalidTotals)?;

        Ok(value.try_into().map_err(|_| PayrollError::InvalidTotals)?)
    }

    fn parse_u32(inputs: &Vec<Bn254Fr>, idx: u32) -> Result<u32, PayrollError> {
        let value = inputs
            .get(idx)
            .ok_or(PayrollError::InvalidTotals)?
            .to_u256()
            .to_u128()
            .ok_or(PayrollError::InvalidTotals)?;

        Ok(value.try_into().map_err(|_| PayrollError::InvalidTotals)?)
    }

    fn parse_u64(inputs: &Vec<Bn254Fr>, idx: u32) -> Result<u64, PayrollError> {
        let value = inputs
            .get(idx)
            .ok_or(PayrollError::InvalidTotals)?
            .to_u256()
            .to_u128()
            .ok_or(PayrollError::InvalidTotals)?;

        Ok(value.try_into().map_err(|_| PayrollError::InvalidTotals)?)
    }
}

struct PublicTotals {
    total_amount: i128,
    total_xlm: i128,
    total_usdc: i128,
    employee_total: i128,
    contractor_total: i128,
    freelancer_total: i128,
    vendor_total: i128,
    consultant_total: i128,
    contributor_total: i128,
    employee_count: u32,
    contractor_count: u32,
    freelancer_count: u32,
    vendor_count: u32,
    consultant_count: u32,
    contributor_count: u32,
    period_id: u64,
    _payroll_run_hash: u64,
    batch_index: u32,
    batch_count: u32,
    payee_count_total: u32,
}