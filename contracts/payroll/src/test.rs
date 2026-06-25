#![cfg(test)]

use soroban_sdk::{
    testutils::Address as _,
    token, Address, Bytes, BytesN, Env, Vec,
};

use crate::{PayrollContract, PayrollContractClient, PayrollEmployee, PayrollStatus};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Register the Stellar Asset Contract (SAC) for a fresh test token.
/// The returned address can be passed as `token_contract` to `initialize`.
fn setup_test_token(env: &Env, admin: &Address) -> Address {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    sac.address()
}

/// Build a `PayrollEmployee` with a valid BN254 Fr commitment byte array.
/// The commitment value 1 is a valid non-zero field element well below r.
fn make_employee(env: &Env, address: Address, amount: i128, index: u64) -> PayrollEmployee {
    // commitment = 0x0000…0001 — non-zero, < BN254 r, valid.
    let mut commitment_arr = [0u8; 32];
    commitment_arr[31] = 1;
    let commitment = BytesN::from_array(env, &commitment_arr);

    // Minimal Merkle proof: one sibling node that is also a valid field element.
    let mut sibling_arr = [0u8; 32];
    sibling_arr[31] = 2;
    let mut proof = Vec::new(env);
    proof.push_back(BytesN::from_array(env, &sibling_arr));

    PayrollEmployee {
        address,
        payout_amount:     amount,
        salary_commitment: commitment,
        merkle_proof:      proof,
        merkle_index:      index,
    }
}

/// Build a minimal proof blob (128 bytes) that passes the structure check.
fn make_proof(env: &Env, len: usize) -> Bytes {
    let data = (0..len).map(|i| (i & 0xff) as u8).collect::<std::vec::Vec<u8>>();
    Bytes::from_slice(env, &data)
}

/// Build public_inputs: one valid BN254 scalar per employee.
fn make_public_inputs(env: &Env, count: usize) -> Vec<BytesN<32>> {
    let mut v = Vec::new(env);
    for i in 0..count {
        let mut arr = [0u8; 32];
        // Use value i+1 so every element is non-zero and < r.
        arr[31] = ((i + 1) & 0xff) as u8;
        v.push_back(BytesN::from_array(env, &arr));
    }
    v
}

/// Build a valid 32-byte Merkle root (non-zero, < BN254 r).
fn make_merkle_root(env: &Env) -> BytesN<32> {
    let mut arr = [0u8; 32];
    arr[31] = 0xAB;
    BytesN::from_array(env, &arr)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[test]
fn test_initialize_contract() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, PayrollContract);
    let client      = PayrollContractClient::new(&env, &contract_id);

    let employer        = Address::generate(&env);
    let token_contract  = Address::generate(&env);

    let result = client.initialize(&employer, &token_contract);
    assert_eq!(result, 0, "initial batch count should be 0");
}

#[test]
fn test_submit_single_employee_batch() {
    let env = Env::default();
    env.mock_all_auths();

    let employer       = Address::generate(&env);
    let token_contract = setup_test_token(&env, &employer);

    let contract_id = env.register_contract(None, PayrollContract);
    let client      = PayrollContractClient::new(&env, &contract_id);

    client.initialize(&employer, &token_contract);

    let token_admin = token::StellarAssetContractClient::new(&env, &token_contract);
    token_admin.mint(&employer, &10_000);

    let employee_addr  = Address::generate(&env);
    let mut employees  = Vec::new(&env);
    employees.push_back(make_employee(&env, employee_addr.clone(), 7_000, 0));

    let zk_proof      = make_proof(&env, 256);
    let public_inputs = make_public_inputs(&env, 1);
    let merkle_root   = make_merkle_root(&env);

    let batch_id = client.submit_batch(
        &employer,
        &employees,
        &zk_proof,
        &public_inputs,
        &7_000,
        &1_000,
        &2_000,
        &merkle_root,
    );

    assert_eq!(batch_id, 1);

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, PayrollStatus::Completed);
    assert_eq!(batch.successful_payments, 1);
    assert_eq!(batch.failed_payments, 0);

    let token_client = token::Client::new(&env, &token_contract);
    assert_eq!(token_client.balance(&employee_addr), 7_000);
}

#[test]
fn test_submit_dynamic_batch_five_employees() {
    let env = Env::default();
    env.mock_all_auths();

    let employer       = Address::generate(&env);
    let token_contract = setup_test_token(&env, &employer);
    let contract_id    = env.register_contract(None, PayrollContract);
    let client         = PayrollContractClient::new(&env, &contract_id);

    client.initialize(&employer, &token_contract);

    let token_admin = token::StellarAssetContractClient::new(&env, &token_contract);
    token_admin.mint(&employer, &50_000);

    let amounts: [i128; 5] = [8_000, 9_000, 10_000, 11_000, 12_000];
    let total: i128 = amounts.iter().sum();

    let mut employees = Vec::new(&env);
    for (i, &amt) in amounts.iter().enumerate() {
        employees.push_back(make_employee(
            &env,
            Address::generate(&env),
            amt,
            i as u64,
        ));
    }

    let zk_proof      = make_proof(&env, 512);
    let public_inputs = make_public_inputs(&env, 5);
    let merkle_root   = make_merkle_root(&env);

    let batch_id = client.submit_batch(
        &employer,
        &employees,
        &zk_proof,
        &public_inputs,
        &total,
        &1_000,
        &2_000,
        &merkle_root,
    );

    assert_eq!(batch_id, 1);
    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, PayrollStatus::Completed);
    assert_eq!(batch.successful_payments, 5);
}

#[test]
fn test_submit_batch_wrong_total_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let employer       = Address::generate(&env);
    let token_contract = setup_test_token(&env, &employer);
    let contract_id    = env.register_contract(None, PayrollContract);
    let client         = PayrollContractClient::new(&env, &contract_id);

    client.initialize(&employer, &token_contract);

    let token_admin = token::StellarAssetContractClient::new(&env, &token_contract);
    token_admin.mint(&employer, &20_000);

    let mut employees = Vec::new(&env);
    employees.push_back(make_employee(&env, Address::generate(&env), 5_000, 0));

    let zk_proof      = make_proof(&env, 256);
    let public_inputs = make_public_inputs(&env, 1);
    let merkle_root   = make_merkle_root(&env);

    // Pass wrong total — verifier should reject.
    let result = client.try_submit_batch(
        &employer,
        &employees,
        &zk_proof,
        &public_inputs,
        &9_999, // wrong
        &1_000,
        &2_000,
        &merkle_root,
    );

    assert!(result.is_err(), "should reject mismatched total");
}

#[test]
fn test_short_proof_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let employer       = Address::generate(&env);
    let token_contract = setup_test_token(&env, &employer);
    let contract_id    = env.register_contract(None, PayrollContract);
    let client         = PayrollContractClient::new(&env, &contract_id);

    client.initialize(&employer, &token_contract);

    let mut employees = Vec::new(&env);
    employees.push_back(make_employee(&env, Address::generate(&env), 5_000, 0));

    let short_proof   = make_proof(&env, 32); // < 128 bytes — invalid
    let public_inputs = make_public_inputs(&env, 1);
    let merkle_root   = make_merkle_root(&env);

    let result = client.try_submit_batch(
        &employer,
        &employees,
        &short_proof,
        &public_inputs,
        &5_000,
        &1_000,
        &2_000,
        &merkle_root,
    );

    assert!(result.is_err(), "should reject a proof that is too short");
}

#[test]
fn test_get_stats_multiple_batches() {
    let env = Env::default();
    env.mock_all_auths();

    let employer       = Address::generate(&env);
    let token_contract = setup_test_token(&env, &employer);
    let contract_id    = env.register_contract(None, PayrollContract);
    let client         = PayrollContractClient::new(&env, &contract_id);

    client.initialize(&employer, &token_contract);

    let token_admin = token::StellarAssetContractClient::new(&env, &token_contract);
    token_admin.mint(&employer, &100_000);

    for batch_num in 0..3u64 {
        let mut employees = Vec::new(&env);
        employees.push_back(make_employee(
            &env,
            Address::generate(&env),
            10_000,
            batch_num,
        ));
        let zk_proof      = make_proof(&env, 256);
        let public_inputs = make_public_inputs(&env, 1);
        let merkle_root   = make_merkle_root(&env);

        client.submit_batch(
            &employer,
            &employees,
            &zk_proof,
            &public_inputs,
            &10_000,
            &1_000,
            &2_000,
            &merkle_root,
        );
    }

    let stats = client.get_stats(&employer);
    assert_eq!(stats.total_batches,   3);
    assert_eq!(stats.total_paid,      30_000);
    assert_eq!(stats.total_employees, 3);
}
