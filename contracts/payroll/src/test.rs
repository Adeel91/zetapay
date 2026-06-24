#![cfg(test)]
use soroban_sdk::{Env, Address, Vec, testutils::Address as _, BytesN, token, Bytes};
use crate::{PayrollContract, PayrollContractClient, PayrollEmployee, PayrollStatus};

#[soroban_sdk::contract]
pub struct MockVerifier;

#[soroban_sdk::contractimpl]
impl MockVerifier {
    pub fn verify_batch(
        _env: Env,
        _commitments: Vec<BytesN<32>>,
        _amounts: Vec<i128>,
        _total_amount: i128,
        _proof: Bytes,
        _public_inputs: Vec<BytesN<32>>,
        _merkle_root: BytesN<32>,
        _merkle_proofs: Vec<Vec<BytesN<32>>>,
        _merkle_indices: Vec<u64>,
    ) -> bool {
        true
    }
}

fn setup_test_token(env: &Env, admin: &Address) -> Address {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    sac.address()
}

#[test]
fn test_initialize_contract() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let usdc_contract = Address::generate(&env);
    let zk_verifier = Address::generate(&env);
    let merkle_root = BytesN::from_array(&env, &[1u8; 32]);

    let result = client.initialize(&employer, &usdc_contract, &zk_verifier, &merkle_root);
    assert_eq!(result, 0);
}

#[test]
fn test_submit_batch_success() {
    let env = Env::default();
    env.mock_all_auths();

    let employer = Address::generate(&env);
    let usdc_contract = setup_test_token(&env, &employer);
    let zk_verifier = env.register_contract(None, MockVerifier);
    let merkle_root = BytesN::from_array(&env, &[1u8; 32]);

    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    client.initialize(&employer, &usdc_contract, &zk_verifier, &merkle_root);

    let usdc_admin_client = token::StellarAssetContractClient::new(&env, &usdc_contract);
    usdc_admin_client.mint(&employer, &10000);

    let employee1 = Address::generate(&env);
    let employee2 = Address::generate(&env);

    let mut proof1 = Vec::new(&env);
    proof1.push_back(BytesN::from_array(&env, &[1u8; 32]));
    let mut proof2 = Vec::new(&env);
    proof2.push_back(BytesN::from_array(&env, &[2u8; 32]));

    let employees = Vec::from_array(
        &env,
        [
            PayrollEmployee {
                address: employee1.clone(),
                amount_usdc: 5000,
                salary_commitment: BytesN::from_array(&env, &[1u8; 32]),
                merkle_proof: proof1,
                merkle_index: 0,
            },
            PayrollEmployee {
                address: employee2.clone(),
                amount_usdc: 3000,
                salary_commitment: BytesN::from_array(&env, &[2u8; 32]),
                merkle_proof: proof2,
                merkle_index: 1,
            },
        ],
    );

    let zk_proof = Bytes::from_slice(&env, &[1u8, 2u8, 3u8]);
    let mut public_inputs = Vec::new(&env);
    public_inputs.push_back(BytesN::from_array(&env, &[1u8; 32]));

    let batch_id = client.submit_batch(&employer, &employees, &zk_proof, &public_inputs, &8000, &1000, &2000, &merkle_root);
    assert_eq!(batch_id, 1);

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, PayrollStatus::Completed);
}
