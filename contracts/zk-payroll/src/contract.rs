use soroban_sdk::{
    contract, contractimpl,
    crypto::bn254::Bn254Fr,
    token, Address, Bytes, BytesN, Env, U256, Vec,
};
use zk_verifier::{Groth16VerifierClient, Proof};

use crate::error::PayrollError;
use crate::storage::Storage;
use crate::types::{Payee, PayeeType, PayrollAudit, TokenType};

// ─── Totals struct ────────────────────────────────────────────

#[derive(Default)]
pub struct Totals {
    pub total: i128,
    pub xlm: i128,
    pub usdc: i128,
    pub emp_total: i128,
    pub con_total: i128,
    pub free_total: i128,
    pub ven_total: i128,
    pub cons_total: i128,
    pub emp_cnt: u32,
    pub con_cnt: u32,
    pub free_cnt: u32,
    pub ven_cnt: u32,
    pub cons_cnt: u32,
}

#[contract]
pub struct ZkPayroll;

#[contractimpl]
impl ZkPayroll {
    pub fn initialize(
        env: Env,
        employer: Address,
        verifier: Address,
        vk: zk_verifier::VerificationKey,
        xlm_token: Address,
        usdc_token: Address,
    ) -> Result<(), PayrollError> {
        employer.require_auth();
        if Storage::has_employer(&env) {
            return Err(PayrollError::AlreadyInitialized);
        }
        Storage::set_employer(&env, &employer);
        Storage::set_verifier(&env, &verifier);
        Storage::set_verification_key(&env, &vk);
        Storage::set_batch_counter(&env, &0);
        Storage::set_xlm_token(&env, &xlm_token);
        Storage::set_usdc_token(&env, &usdc_token);
        Ok(())
    }

    pub fn submit_payroll(
        env: Env,
        payees: Vec<Payee>,
        proof: Proof,
        public_inputs: Vec<Bn254Fr>,
        tx_hash: BytesN<32>,
    ) -> Result<u64, PayrollError> {
        let employer = Storage::get_employer(&env)?;
        employer.require_auth();

        if payees.is_empty() {
            return Err(PayrollError::NoPayees);
        }

        // Verify proof
        let verifier = Storage::get_verifier(&env)?;
        let vk = Storage::get_verification_key(&env)?;
        let verifier_client = Groth16VerifierClient::new(&env, &verifier);
        if !verifier_client.verify_proof(&vk, &proof, &public_inputs) {
            return Err(PayrollError::InvalidProof);
        }

        // Parse public inputs
        let total_amount = Self::parse_i128(&public_inputs, 10)?;
        let employee_total = Self::parse_i128(&public_inputs, 11)?;
        let contractor_total = Self::parse_i128(&public_inputs, 12)?;
        let freelancer_total = Self::parse_i128(&public_inputs, 13)?;
        let vendor_total = Self::parse_i128(&public_inputs, 14)?;
        let consultant_total = Self::parse_i128(&public_inputs, 15)?;
        let employee_count = Self::parse_u32(&public_inputs, 16)?;
        let contractor_count = Self::parse_u32(&public_inputs, 17)?;
        let freelancer_count = Self::parse_u32(&public_inputs, 18)?;
        let vendor_count = Self::parse_u32(&public_inputs, 19)?;
        let consultant_count = Self::parse_u32(&public_inputs, 20)?;
        let employee_count_total = Self::parse_u32(&public_inputs, 22)?;

        // Verify commitments and calculate totals
        let totals = Self::verify_commitments(&env, &payees, &public_inputs, employee_count_total)?;

        // Verify all totals match (pass by reference)
        Self::verify_all_totals(
            &totals,
            total_amount,
            employee_total,
            contractor_total,
            freelancer_total,
            vendor_total,
            consultant_total,
            employee_count,
            contractor_count,
            freelancer_count,
            vendor_count,
            consultant_count,
        )?;

        // Store audit
        let batch_id = Self::store_audit(&env, &employer, &tx_hash, &public_inputs, &totals)?;

        // Execute payments
        Self::execute_payments(&env, &payees, &employer)?;

        Ok(batch_id)
    }

    pub fn get_audit(env: Env, batch_id: u64) -> Result<PayrollAudit, PayrollError> {
        Storage::get_audit(&env, batch_id)
    }

    pub fn get_batch_count(env: Env) -> u64 {
        Storage::get_batch_counter(&env)
    }

    // ─── Helpers ───────────────────────────────────────────────

    fn parse_i128(inputs: &Vec<Bn254Fr>, idx: usize) -> Result<i128, PayrollError> {
        let val = inputs
            .get(idx as u32)
            .ok_or(PayrollError::MalformedInput)?
            .to_u256()
            .to_u128()
            .ok_or(PayrollError::AmountMismatch)?;
        Ok(val.try_into().map_err(|_| PayrollError::AmountMismatch)?)
    }

    fn parse_u32(inputs: &Vec<Bn254Fr>, idx: usize) -> Result<u32, PayrollError> {
        let val = inputs
            .get(idx as u32)
            .ok_or(PayrollError::MalformedInput)?
            .to_u256()
            .to_u128()
            .ok_or(PayrollError::AmountMismatch)?;
        Ok(val.try_into().map_err(|_| PayrollError::AmountMismatch)?)
    }

    fn verify_commitments(
        env: &Env,
        payees: &Vec<Payee>,
        inputs: &Vec<Bn254Fr>,
        total_count: u32,
    ) -> Result<Totals, PayrollError> {
        let mut t = Totals::default();
        for (i, payee) in payees.iter().enumerate() {
            if i >= total_count as usize {
                continue;
            }

            let commitment = inputs
                .get(i as u32)
                .ok_or(PayrollError::MalformedInput)?
                .to_u256();
            let bytes = Bytes::from_array(env, &payee.commitment.to_array());
            if commitment != U256::from_be_bytes(env, &bytes) {
                return Err(PayrollError::CommitmentMismatch);
            }

            t.total += payee.amount;
            match payee.token_type {
                TokenType::XLM => t.xlm += payee.amount,
                TokenType::USDC => t.usdc += payee.amount,
            }
            match payee.payee_type {
                PayeeType::Employee => {
                    t.emp_total += payee.amount;
                    t.emp_cnt += 1;
                }
                PayeeType::Contractor => {
                    t.con_total += payee.amount;
                    t.con_cnt += 1;
                }
                PayeeType::Freelancer => {
                    t.free_total += payee.amount;
                    t.free_cnt += 1;
                }
                PayeeType::Vendor => {
                    t.ven_total += payee.amount;
                    t.ven_cnt += 1;
                }
                PayeeType::Consultant => {
                    t.cons_total += payee.amount;
                    t.cons_cnt += 1;
                }
            }
        }
        Ok(t)
    }

    fn verify_all_totals(
        t: &Totals,
        total: i128,
        emp_total: i128,
        con_total: i128,
        free_total: i128,
        ven_total: i128,
        cons_total: i128,
        emp_cnt: u32,
        con_cnt: u32,
        free_cnt: u32,
        ven_cnt: u32,
        cons_cnt: u32,
    ) -> Result<(), PayrollError> {
        if t.total != total
            || t.emp_total != emp_total
            || t.con_total != con_total
            || t.free_total != free_total
            || t.ven_total != ven_total
            || t.cons_total != cons_total
        {
            return Err(PayrollError::AmountMismatch);
        }
        if t.emp_cnt != emp_cnt
            || t.con_cnt != con_cnt
            || t.free_cnt != free_cnt
            || t.ven_cnt != ven_cnt
            || t.cons_cnt != cons_cnt
        {
            return Err(PayrollError::AmountMismatch);
        }
        Ok(())
    }

    fn store_audit(
        env: &Env,
        employer: &Address,
        tx_hash: &BytesN<32>,
        inputs: &Vec<Bn254Fr>,
        t: &Totals,
    ) -> Result<u64, PayrollError> {
        let batch_id = Storage::get_batch_counter(env) + 1;
        let tx_bytes = Bytes::from_array(env, &tx_hash.to_array());
        let audit = PayrollAudit {
            batch_id,
            employer: employer.clone(),
            total_amount: Self::parse_i128(inputs, 10)?,
            total_xlm: t.xlm,
            total_usdc: t.usdc,
            employee_total: Self::parse_i128(inputs, 11)?,
            contractor_total: Self::parse_i128(inputs, 12)?,
            freelancer_total: Self::parse_i128(inputs, 13)?,
            vendor_total: Self::parse_i128(inputs, 14)?,
            consultant_total: Self::parse_i128(inputs, 15)?,
            employee_count: Self::parse_u32(inputs, 16)?,
            contractor_count: Self::parse_u32(inputs, 17)?,
            freelancer_count: Self::parse_u32(inputs, 18)?,
            vendor_count: Self::parse_u32(inputs, 19)?,
            consultant_count: Self::parse_u32(inputs, 20)?,
            tx_hash: tx_hash.clone(),
            timestamp: env.ledger().timestamp(),
            proof_hash: env.crypto().sha256(&tx_bytes).into(),
            is_verified: true,
        };
        Storage::set_audit(env, batch_id, &audit);
        Storage::set_batch_counter(env, &batch_id);
        Ok(batch_id)
    }

    fn execute_payments(
        env: &Env,
        payees: &Vec<Payee>,
        employer: &Address,
    ) -> Result<(), PayrollError> {
        let xlm_token = Storage::get_xlm_token(env)?;
        let usdc_token = Storage::get_usdc_token(env)?;
        for p in payees.iter() {
            match p.token_type {
                TokenType::XLM => token::TokenClient::new(env, &xlm_token)
                    .transfer(employer, &p.address, &p.amount),
                TokenType::USDC => token::TokenClient::new(env, &usdc_token)
                    .transfer(employer, &p.address, &p.amount),
            }
        }
        Ok(())
    }
}