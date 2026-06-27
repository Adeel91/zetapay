#![cfg(test)]

extern crate std;

use crate::{
    contract::{ZkPayroll, ZkPayrollClient},
    fixtures::{
        REAL_PROOF_A, REAL_PROOF_B, REAL_PROOF_C, REAL_SIGNALS, REAL_VK_ALPHA, REAL_VK_BETA,
        REAL_VK_DELTA, REAL_VK_GAMMA, REAL_VK_IC,
    },
    types::{PayeeType, PayrollPayment, Token},
};

use soroban_sdk::{
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
    testutils::Address as _,
    Address, BytesN, Env, Vec,
};

use zk_verifier::{Proof, VerificationKey, ZkVerifier};

fn deploy_verifier(env: &Env) -> Address {
    env.register(ZkVerifier, ())
}

fn deploy_payroll(env: &Env) -> ZkPayrollClient<'_> {
    let id = env.register(ZkPayroll, ());
    ZkPayrollClient::new(env, &id)
}

fn token_contract(env: &Env, admin: &Address) -> Address {
    env.register_stellar_asset_contract_v2(admin.clone()).address()
}

fn make_vk(env: &Env) -> VerificationKey {
    let alpha = Bn254G1Affine::from_bytes(BytesN::from_array(env, &REAL_VK_ALPHA));
    let beta = Bn254G2Affine::from_bytes(BytesN::from_array(env, &REAL_VK_BETA));
    let gamma = Bn254G2Affine::from_bytes(BytesN::from_array(env, &REAL_VK_GAMMA));
    let delta = Bn254G2Affine::from_bytes(BytesN::from_array(env, &REAL_VK_DELTA));

    let mut ic = Vec::new(env);

    for point in REAL_VK_IC.iter() {
        ic.push_back(Bn254G1Affine::from_bytes(BytesN::from_array(env, point)));
    }

    VerificationKey {
        alpha,
        beta,
        gamma,
        delta,
        ic,
    }
}

fn make_proof(env: &Env) -> Proof {
    Proof {
        a: Bn254G1Affine::from_bytes(BytesN::from_array(env, &REAL_PROOF_A)),
        b: Bn254G2Affine::from_bytes(BytesN::from_array(env, &REAL_PROOF_B)),
        c: Bn254G1Affine::from_bytes(BytesN::from_array(env, &REAL_PROOF_C)),
    }
}

fn make_public_inputs(env: &Env) -> Vec<Bn254Fr> {
    let mut inputs = Vec::new(env);

    for signal in REAL_SIGNALS.iter() {
        inputs.push_back(Bn254Fr::from_bytes(BytesN::from_array(env, signal)));
    }

    inputs
}

fn make_payments(env: &Env) -> Vec<PayrollPayment> {
    let mut payments = Vec::new(env);

    payments.push_back(PayrollPayment {
        payee_id: 1,
        recipient: Address::generate(env),
        amount: 5000,
        token: Token::XLM,
        payee_type: PayeeType::Employee,
    });

    payments.push_back(PayrollPayment {
        payee_id: 2,
        recipient: Address::generate(env),
        amount: 3000,
        token: Token::USDC,
        payee_type: PayeeType::Employee,
    });

    payments.push_back(PayrollPayment {
        payee_id: 3,
        recipient: Address::generate(env),
        amount: 7000,
        token: Token::XLM,
        payee_type: PayeeType::Contractor,
    });

    payments.push_back(PayrollPayment {
        payee_id: 4,
        recipient: Address::generate(env),
        amount: 12000,
        token: Token::USDC,
        payee_type: PayeeType::Freelancer,
    });

    payments.push_back(PayrollPayment {
        payee_id: 5,
        recipient: Address::generate(env),
        amount: 9000,
        token: Token::XLM,
        payee_type: PayeeType::Vendor,
    });

    payments
}

#[test]
fn submit_batch_verifies_real_groth16_proof_and_stores_record() {
    let env = Env::default();
    env.mock_all_auths();

    let employer = Address::generate(&env);
    let verifier = deploy_verifier(&env);
    let payroll = deploy_payroll(&env);

    let xlm_token = token_contract(&env, &employer);
    let usdc_token = token_contract(&env, &employer);

    let vk = make_vk(&env);

    let init = payroll.try_initialize(
        &employer,
        &verifier,
        &xlm_token,
        &usdc_token,
        &vk,
    );

    assert!(init.is_ok());
    assert!(init.unwrap().is_ok());

    let payments = make_payments(&env);
    let proof = make_proof(&env);
    let public_inputs = make_public_inputs(&env);

    let payroll_run_hash = BytesN::from_array(&env, &[7u8; 32]);
    let commitment_root = BytesN::from_array(&env, &[9u8; 32]);

    let submit = payroll.try_submit_batch(
        &payments,
        &proof,
        &public_inputs,
        &payroll_run_hash,
        &987654321u64,
        &202601u64,
        &0u32,
        &1u32,
        &commitment_root,
    );

    assert!(submit.is_ok());

    let inner = submit.unwrap();
    assert!(inner.is_ok());

    let batch_id = inner.unwrap();
    assert_eq!(batch_id, 1);
    assert_eq!(payroll.get_batch_count(), 1);

    let record = payroll.get_payroll_record(&batch_id);

    assert_eq!(record.batch.payment_count, 5);
    assert_eq!(record.batch.total_amount, 36000);
    assert_eq!(record.batch.total_xlm, 21000);
    assert_eq!(record.batch.total_usdc, 15000);
    assert!(!record.batch.is_executed);
}

#[test]
fn execute_batch_transfers_xlm_and_usdc_once() {
    let env = Env::default();
    env.mock_all_auths();

    let employer = Address::generate(&env);
    let verifier = deploy_verifier(&env);
    let payroll = deploy_payroll(&env);

    let xlm_token = token_contract(&env, &employer);
    let usdc_token = token_contract(&env, &employer);

    let xlm_asset = soroban_sdk::token::StellarAssetClient::new(&env, &xlm_token);
    let usdc_asset = soroban_sdk::token::StellarAssetClient::new(&env, &usdc_token);

    xlm_asset.mint(&employer, &21000);
    usdc_asset.mint(&employer, &15000);

    let vk = make_vk(&env);

    let init = payroll.try_initialize(
        &employer,
        &verifier,
        &xlm_token,
        &usdc_token,
        &vk,
    );

    assert!(init.is_ok());
    assert!(init.unwrap().is_ok());

    let payments = make_payments(&env);
    let proof = make_proof(&env);
    let public_inputs = make_public_inputs(&env);

    let first_xlm_recipient = payments.get(0).unwrap().recipient;
    let first_usdc_recipient = payments.get(1).unwrap().recipient;

    let payroll_run_hash = BytesN::from_array(&env, &[7u8; 32]);
    let commitment_root = BytesN::from_array(&env, &[9u8; 32]);

    let submit = payroll.try_submit_batch(
        &payments,
        &proof,
        &public_inputs,
        &payroll_run_hash,
        &987654321u64,
        &202601u64,
        &0u32,
        &1u32,
        &commitment_root,
    );

    assert!(submit.is_ok());

    let inner = submit.unwrap();
    assert!(inner.is_ok());

    let batch_id = inner.unwrap();

    let execute = payroll.try_execute_batch(&batch_id);
    assert!(execute.is_ok());
    assert!(execute.unwrap().is_ok());

    let xlm_client = soroban_sdk::token::TokenClient::new(&env, &xlm_token);
    let usdc_client = soroban_sdk::token::TokenClient::new(&env, &usdc_token);

    assert_eq!(xlm_client.balance(&employer), 0);
    assert_eq!(usdc_client.balance(&employer), 0);

    assert_eq!(xlm_client.balance(&first_xlm_recipient), 5000);
    assert_eq!(usdc_client.balance(&first_usdc_recipient), 3000);

    let record = payroll.get_payroll_record(&batch_id);
    assert!(record.batch.is_executed);

    let second_execute = payroll.try_execute_batch(&batch_id);
    assert!(second_execute.is_err());
}

#[test]
fn submit_batch_rejects_duplicate_proof() {
    let env = Env::default();
    env.mock_all_auths();

    let employer = Address::generate(&env);
    let verifier = deploy_verifier(&env);
    let payroll = deploy_payroll(&env);

    let xlm_token = token_contract(&env, &employer);
    let usdc_token = token_contract(&env, &employer);

    let vk = make_vk(&env);

    let init = payroll.try_initialize(
        &employer,
        &verifier,
        &xlm_token,
        &usdc_token,
        &vk,
    );

    assert!(init.is_ok());
    assert!(init.unwrap().is_ok());

    let payments = make_payments(&env);
    let proof = make_proof(&env);
    let public_inputs = make_public_inputs(&env);

    let payroll_run_hash = BytesN::from_array(&env, &[7u8; 32]);
    let commitment_root = BytesN::from_array(&env, &[9u8; 32]);

    let first_submit = payroll.try_submit_batch(
        &payments,
        &proof,
        &public_inputs,
        &payroll_run_hash,
        &987654321u64,
        &202601u64,
        &0u32,
        &1u32,
        &commitment_root,
    );

    assert!(first_submit.is_ok());
    assert!(first_submit.unwrap().is_ok());

    let second_submit = payroll.try_submit_batch(
        &payments,
        &proof,
        &public_inputs,
        &payroll_run_hash,
        &987654321u64,
        &202601u64,
        &0u32,
        &1u32,
        &commitment_root,
    );

    assert!(second_submit.is_err());
    assert_eq!(payroll.get_batch_count(), 1);
}

#[test]
fn submit_batch_rejects_payment_totals_that_do_not_match_proof() {
    let env = Env::default();
    env.mock_all_auths();

    let employer = Address::generate(&env);
    let verifier = deploy_verifier(&env);
    let payroll = deploy_payroll(&env);

    let xlm_token = token_contract(&env, &employer);
    let usdc_token = token_contract(&env, &employer);

    let vk = make_vk(&env);

    let init = payroll.try_initialize(
        &employer,
        &verifier,
        &xlm_token,
        &usdc_token,
        &vk,
    );

    assert!(init.is_ok());
    assert!(init.unwrap().is_ok());

    let mut payments = make_payments(&env);

    let mut first_payment = payments.get(0).unwrap();
    first_payment.amount = 9999;
    payments.set(0, first_payment);

    let proof = make_proof(&env);
    let public_inputs = make_public_inputs(&env);

    let payroll_run_hash = BytesN::from_array(&env, &[7u8; 32]);
    let commitment_root = BytesN::from_array(&env, &[9u8; 32]);

    let submit = payroll.try_submit_batch(
        &payments,
        &proof,
        &public_inputs,
        &payroll_run_hash,
        &987654321u64,
        &202601u64,
        &0u32,
        &1u32,
        &commitment_root,
    );

    assert!(submit.is_err());
    assert_eq!(payroll.get_batch_count(), 0);
}

#[test]
fn execute_batch_rejects_unknown_batch() {
    let env = Env::default();
    env.mock_all_auths();

    let employer = Address::generate(&env);
    let verifier = deploy_verifier(&env);
    let payroll = deploy_payroll(&env);

    let xlm_token = token_contract(&env, &employer);
    let usdc_token = token_contract(&env, &employer);

    let vk = make_vk(&env);

    let init = payroll.try_initialize(
        &employer,
        &verifier,
        &xlm_token,
        &usdc_token,
        &vk,
    );

    assert!(init.is_ok());
    assert!(init.unwrap().is_ok());

    let execute = payroll.try_execute_batch(&999u64);

    assert!(execute.is_err());
}

#[test]
fn payroll_run_summary_tracks_submission_and_execution() {
    let env = Env::default();
    env.mock_all_auths();

    let employer = Address::generate(&env);
    let verifier = deploy_verifier(&env);
    let payroll = deploy_payroll(&env);

    let xlm_token = token_contract(&env, &employer);
    let usdc_token = token_contract(&env, &employer);

    let xlm_asset = soroban_sdk::token::StellarAssetClient::new(&env, &xlm_token);
    let usdc_asset = soroban_sdk::token::StellarAssetClient::new(&env, &usdc_token);

    xlm_asset.mint(&employer, &21000);
    usdc_asset.mint(&employer, &15000);

    let vk = make_vk(&env);

    let init = payroll.try_initialize(
        &employer,
        &verifier,
        &xlm_token,
        &usdc_token,
        &vk,
    );

    assert!(init.is_ok());
    assert!(init.unwrap().is_ok());

    let payments = make_payments(&env);
    let proof = make_proof(&env);
    let public_inputs = make_public_inputs(&env);

    let payroll_run_hash = BytesN::from_array(&env, &[7u8; 32]);
    let commitment_root = BytesN::from_array(&env, &[9u8; 32]);

    let submit = payroll.try_submit_batch(
        &payments,
        &proof,
        &public_inputs,
        &payroll_run_hash,
        &987654321u64,
        &202601u64,
        &0u32,
        &1u32,
        &commitment_root,
    );

    assert!(submit.is_ok());

    let batch_id = submit.unwrap().unwrap();

    let summary_after_submit = payroll
        .get_payroll_run_summary(&payroll_run_hash)
        .unwrap();

    assert_eq!(summary_after_submit.submitted_batches, 1);
    assert_eq!(summary_after_submit.executed_batches, 0);
    assert_eq!(summary_after_submit.total_amount, 36000);
    assert_eq!(summary_after_submit.total_xlm, 21000);
    assert_eq!(summary_after_submit.total_usdc, 15000);
    assert!(summary_after_submit.is_complete);
    assert!(!summary_after_submit.is_fully_executed);

    let execute = payroll.try_execute_batch(&batch_id);
    assert!(execute.is_ok());
    assert!(execute.unwrap().is_ok());

    let summary_after_execute = payroll
        .get_payroll_run_summary(&payroll_run_hash)
        .unwrap();

    assert_eq!(summary_after_execute.submitted_batches, 1);
    assert_eq!(summary_after_execute.executed_batches, 1);
    assert!(summary_after_execute.is_complete);
    assert!(summary_after_execute.is_fully_executed);
}