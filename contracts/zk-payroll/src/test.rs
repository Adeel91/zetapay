#![cfg(test)]

use crate::contract::{ZkPayroll, ZkPayrollClient};
use crate::fixtures::{REAL_PROOF_A, REAL_PROOF_B, REAL_PROOF_C, REAL_SIGNALS, REAL_VK};
use crate::types::{Payee, PayeeType, TokenType};

use soroban_sdk::{
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
    testutils::Address as _,
    token, Address, BytesN, Env, Vec,
};

use zk_verifier::{Groth16Verifier, Proof, VerificationKey};

fn deploy_verifier(env: &Env) -> Address {
    env.register(Groth16Verifier, ())
}

fn deploy_payroll(env: &Env) -> ZkPayrollClient<'_> {
    let id = env.register(ZkPayroll, ());
    ZkPayrollClient::new(env, &id)
}

fn mock_token(env: &Env, admin: &Address) -> Address {
    env.register_stellar_asset_contract_v2(admin.clone()).address()
}

fn read_g1(env: &Env, bytes: &[u8], offset: &mut usize) -> Bn254G1Affine {
    let mut buf = [0u8; 64];
    buf.copy_from_slice(&bytes[*offset..*offset + 64]);
    *offset += 64;
    Bn254G1Affine::from_bytes(BytesN::from_array(env, &buf))
}

fn read_g2(env: &Env, bytes: &[u8], offset: &mut usize) -> Bn254G2Affine {
    let mut buf = [0u8; 128];
    buf.copy_from_slice(&bytes[*offset..*offset + 128]);
    *offset += 128;
    Bn254G2Affine::from_bytes(BytesN::from_array(env, &buf))
}

fn parse_vk(env: &Env, vk_bytes: &[u8]) -> VerificationKey {
    let mut offset = 0usize;

    let alpha = read_g1(env, vk_bytes, &mut offset);
    let beta = read_g2(env, vk_bytes, &mut offset);
    let gamma = read_g2(env, vk_bytes, &mut offset);
    let delta = read_g2(env, vk_bytes, &mut offset);

    let remaining = vk_bytes.len() - offset;
    assert_eq!(remaining % 64, 0);

    let mut ic = Vec::new(env);
    while offset < vk_bytes.len() {
        ic.push_back(read_g1(env, vk_bytes, &mut offset));
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
    let a = Bn254G1Affine::from_bytes(BytesN::from_array(env, &REAL_PROOF_A));
    let b = Bn254G2Affine::from_bytes(BytesN::from_array(env, &REAL_PROOF_B));
    let c = Bn254G1Affine::from_bytes(BytesN::from_array(env, &REAL_PROOF_C));
    Proof { a, b, c }
}

fn make_signals(env: &Env) -> Vec<Bn254Fr> {
    let mut signals = Vec::new(env);

    for signal in REAL_SIGNALS.iter() {
        signals.push_back(Bn254Fr::from_bytes(BytesN::from_array(env, signal)));
    }

    signals
}

fn signal_i128(env: &Env, idx: usize) -> i128 {
    Bn254Fr::from_bytes(BytesN::from_array(env, &REAL_SIGNALS[idx]))
        .to_u256()
        .to_u128()
        .unwrap() as i128
}

fn signal_u32(env: &Env, idx: usize) -> u32 {
    Bn254Fr::from_bytes(BytesN::from_array(env, &REAL_SIGNALS[idx]))
        .to_u256()
        .to_u128()
        .unwrap() as u32
}

fn push_group(
    env: &Env,
    payees: &mut Vec<Payee>,
    cursor: &mut usize,
    count: u32,
    total: i128,
    payee_type: PayeeType,
) {
    if count == 0 {
        return;
    }

    let base_amount = total / count as i128;

    for i in 0..count as usize {
        let amount = if i == count as usize - 1 {
            total - base_amount * (count as i128 - 1)
        } else {
            base_amount
        };

        payees.push_back(Payee {
            address: Address::generate(env),
            amount,
            payee_type,
            token_type: TokenType::XLM,
            commitment: BytesN::from_array(env, &REAL_SIGNALS[*cursor]),
        });

        *cursor += 1;
    }
}

fn create_payees_from_signals(env: &Env) -> Vec<Payee> {
    let mut payees = Vec::new(env);
    let mut cursor = 0usize;

    push_group(
        env,
        &mut payees,
        &mut cursor,
        signal_u32(env, 16),
        signal_i128(env, 11),
        PayeeType::Employee,
    );

    push_group(
        env,
        &mut payees,
        &mut cursor,
        signal_u32(env, 17),
        signal_i128(env, 12),
        PayeeType::Contractor,
    );

    push_group(
        env,
        &mut payees,
        &mut cursor,
        signal_u32(env, 18),
        signal_i128(env, 13),
        PayeeType::Freelancer,
    );

    push_group(
        env,
        &mut payees,
        &mut cursor,
        signal_u32(env, 19),
        signal_i128(env, 14),
        PayeeType::Vendor,
    );

    push_group(
        env,
        &mut payees,
        &mut cursor,
        signal_u32(env, 20),
        signal_i128(env, 15),
        PayeeType::Consultant,
    );

    assert_eq!(cursor as u32, signal_u32(env, 22));

    payees
}

fn setup(env: &Env) -> (Address, Address, Address, Address, VerificationKey, ZkPayrollClient<'_>) {
    env.mock_all_auths();

    let employer = Address::generate(env);
    let verifier = deploy_verifier(env);
    let xlm_token = mock_token(env, &employer);
    let usdc_token = mock_token(env, &employer);
    let vk = parse_vk(env, &REAL_VK);
    let client = deploy_payroll(env);

    (employer, verifier, xlm_token, usdc_token, vk, client)
}

#[test]
fn test_initialize() {
    let env = Env::default();

    let (employer, verifier, xlm_token, usdc_token, vk, client) = setup(&env);

    let result = client.try_initialize(&employer, &verifier, &vk, &xlm_token, &usdc_token);

    assert!(result.is_ok());
    assert!(result.unwrap().is_ok());
}

#[test]
fn test_initialize_already_initialized() {
    let env = Env::default();

    let (employer, verifier, xlm_token, usdc_token, vk, client) = setup(&env);

    let result1 = client.try_initialize(&employer, &verifier, &vk, &xlm_token, &usdc_token);
    assert!(result1.is_ok());
    assert!(result1.unwrap().is_ok());

    let result2 = client.try_initialize(&employer, &verifier, &vk, &xlm_token, &usdc_token);
    assert!(result2.is_err());
}

#[test]
fn test_submit_payroll_fails_with_no_payees() {
    let env = Env::default();

    let (employer, verifier, xlm_token, usdc_token, vk, client) = setup(&env);

    client
        .initialize(&employer, &verifier, &vk, &xlm_token, &usdc_token);

    let empty_payees = Vec::new(&env);
    let proof = make_proof(&env);
    let public_inputs = make_signals(&env);
    let tx_hash = BytesN::from_array(&env, &[0u8; 32]);

    let result = client.try_submit_payroll(&empty_payees, &proof, &public_inputs, &tx_hash);

    assert!(result.is_err());
}

#[test]
fn test_submit_payroll_fails_without_initialization() {
    let env = Env::default();
    env.mock_all_auths();

    let client = deploy_payroll(&env);

    let payees = create_payees_from_signals(&env);
    let proof = make_proof(&env);
    let public_inputs = make_signals(&env);
    let tx_hash = BytesN::from_array(&env, &[0u8; 32]);

    let result = client.try_submit_payroll(&payees, &proof, &public_inputs, &tx_hash);

    assert!(result.is_err());
}

#[test]
fn test_get_batch_count() {
    let env = Env::default();

    let (employer, verifier, xlm_token, usdc_token, vk, client) = setup(&env);

    client
        .initialize(&employer, &verifier, &vk, &xlm_token, &usdc_token);

    assert_eq!(client.get_batch_count(), 0);
}

#[test]
fn test_submit_payroll_with_real_proof_data() {
    let env = Env::default();

    let (employer, verifier, xlm_token, usdc_token, vk, client) = setup(&env);

    client
        .initialize(&employer, &verifier, &vk, &xlm_token, &usdc_token);

    let total_amount = signal_i128(&env, 10);
    let asset_client = token::StellarAssetClient::new(&env, &xlm_token);
    asset_client.mint(&employer, &total_amount);

    let payees = create_payees_from_signals(&env);
    let proof = make_proof(&env);
    let public_inputs = make_signals(&env);
    let tx_hash = BytesN::from_array(&env, &[0u8; 32]);

    let result = client.try_submit_payroll(&payees, &proof, &public_inputs, &tx_hash);

    assert!(result.is_ok());
    assert!(result.unwrap().is_ok());
    assert_eq!(client.get_batch_count(), 1);
}