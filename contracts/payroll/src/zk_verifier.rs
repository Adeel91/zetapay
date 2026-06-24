use crate::PayrollEmployee;
use soroban_sdk::{vec, Address, Bytes, BytesN, Env, IntoVal, Symbol, Vec};

pub fn verify_batch_proof(
    env: &Env,
    verifier: &Address,
    employees: &Vec<PayrollEmployee>,
    proof: &Bytes,
    public_inputs: &Vec<BytesN<32>>,
    total_amount: i128,
    merkle_root: BytesN<32>,
) -> bool {
    let contract = verifier.clone();

    let mut commitments: Vec<BytesN<32>> = Vec::new(env);
    let mut amounts: Vec<i128> = Vec::new(env);
    let mut merkle_proofs: Vec<Vec<BytesN<32>>> = Vec::new(env);
    let mut merkle_indices: Vec<u64> = Vec::new(env);

    let employee_count = employees.len();

    for i in 0..employee_count {
        let employee = employees.get(i).unwrap();
        commitments.push_back(employee.salary_commitment.clone());
        amounts.push_back(employee.amount_usdc);

        let mut proof_vec: Vec<BytesN<32>> = Vec::new(env);
        let proof_len = employee.merkle_proof.len();

        for j in 0..proof_len {
            proof_vec.push_back(employee.merkle_proof.get(j).unwrap());
        }
        merkle_proofs.push_back(proof_vec);
        merkle_indices.push_back(employee.merkle_index);
    }

    // Cleaned cross-contract type casting using standard into_val references
    let result: bool = env.invoke_contract(
        &contract,
        &Symbol::new(env, "verify_batch"),
        vec![
            env,
            commitments.into_val(env),
            amounts.into_val(env),
            total_amount.into_val(env),
            proof.into_val(env),
            public_inputs.into_val(env),
            merkle_root.into_val(env),
            merkle_proofs.into_val(env),
            merkle_indices.into_val(env),
        ],
    );

    result
}
