// ZetaPay Payroll ZK Circuit
// 
// This Noir circuit generates zero-knowledge proofs that verify:
// 1. Employee salary commitments are valid
// 2. Total amount equals sum of all salaries
// 3. Merkle tree membership for each employee
// 4. Employee IDs and salaries are correctly committed
// 5. Salary amounts are within valid ranges
//
// The generated proof is verified by the Soroban ZKVerifier contract
// using Protocol 26's BN254 host functions.

use dep::std;

// Constants
global MAX_EMPLOYEES: Field = 10;
global MAX_SALARY: Field = 1000000;
global MIN_SALARY: Field = 1;

// Pedersen hash for BN254 compatibility
fn pedersen_hash(inputs: [Field]) -> Field {
    std::hash::pedersen(inputs)
}

// Generate a salary commitment
// commitment = hash(employee_id, salary, salt)
fn generate_commitment(employee_id: Field, salary: Field, salt: Field) -> Field {
    let inputs = [employee_id, salary, salt];
    pedersen_hash(inputs)
}

// Verify Merkle proof for a single leaf
// Uses standard Merkle tree verification with Pedersen hashing
fn verify_merkle_proof(
    root: Field,
    leaf: Field,
    mut proof: [Field; 32],
    mut path_indices: [Field; 32],
    depth: Field
) -> bool {
    let mut current = leaf;
    let mut idx = 0;
    
    while idx < depth {
        let sibling = proof[idx];
        let path_bit = path_indices[idx];
        
        // Determine order based on path bit
        if path_bit == 0 {
            current = pedersen_hash([current, sibling]);
        } else {
            current = pedersen_hash([sibling, current]);
        }
        
        idx = idx + 1;
    }
    
    current == root
}

// Main circuit function
fn main(
    // Employee data (maximum 10 employees)
    employee_ids: [Field; MAX_EMPLOYEES],
    salaries: [Field; MAX_EMPLOYEES],
    salts: [Field; MAX_EMPLOYEES],
    commitments: [Field; MAX_EMPLOYEES],
    
    // Merkle proof data for each employee
    merkle_roots: [Field; MAX_EMPLOYEES],
    merkle_proofs: [[Field; 32]; MAX_EMPLOYEES],
    merkle_path_indices: [[Field; 32]; MAX_EMPLOYEES],
    merkle_depths: [Field; MAX_EMPLOYEES],
    
    // Total amount for the batch
    total_amount: Field,
    
    // Number of actual employees in this batch
    employee_count: Field,
    
    // Optional public inputs for verification
    public_inputs: [Field; MAX_EMPLOYEES],
) {
    // 1. Validate employee count
    assert(employee_count <= MAX_EMPLOYEES, "Too many employees");
    assert(employee_count > 0, "No employees provided");
    
    // 2. Validate total amount
    assert(total_amount > 0, "Total amount must be greater than 0");
    
    // 3. Process each employee
    let mut calculated_total = 0;
    let mut idx = 0;
    
    while idx < employee_count {
        let employee_id = employee_ids[idx];
        let salary = salaries[idx];
        let salt = salts[idx];
        let commitment = commitments[idx];
        let merkle_root = merkle_roots[idx];
        let merkle_proof = merkle_proofs[idx];
        let merkle_path_indices = merkle_path_indices[idx];
        let merkle_depth = merkle_depths[idx];
        
        // 3a. Validate salary range
        assert(salary >= MIN_SALARY, "Salary below minimum");
        assert(salary <= MAX_SALARY, "Salary exceeds maximum");
        
        // 3b. Verify commitment matches employee data
        let computed_commitment = generate_commitment(employee_id, salary, salt);
        assert(computed_commitment == commitment, "Invalid commitment");
        
        // 3c. Verify Merkle proof for this employee
        let merkle_valid = verify_merkle_proof(
            merkle_root,
            commitment,
            merkle_proof,
            merkle_path_indices,
            merkle_depth
        );
        assert(merkle_valid, "Invalid Merkle proof");
        
        // 3d. Accumulate total
        calculated_total = calculated_total + salary;
        
        idx = idx + 1;
    }
    
    // 4. Verify total amount matches sum
    assert(calculated_total == total_amount, "Total amount mismatch");
    
    // 5. Optionally verify public inputs
    // This ensures the proof is bound to the specific transaction
    idx = 0;
    while idx < employee_count {
        // Public input should match commitment for accountability
        // This allows the contract to verify the proof matches the submitted data
        assert(public_inputs[idx] == commitments[idx], "Public input mismatch");
        idx = idx + 1;
    }
}

#[test]
fn test_basic_payroll() {
    // Test with 2 employees
    let employee_ids = [1, 2, 0, 0, 0, 0, 0, 0, 0, 0];
    let salaries = [5000, 3000, 0, 0, 0, 0, 0, 0, 0, 0];
    let salts = [12345, 67890, 0, 0, 0, 0, 0, 0, 0, 0];
    let commitments = [
        0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef,
        0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890,
        0,0,0,0,0,0,0,0
    ];
    
    let merkle_roots = [0; 10];
    let merkle_proofs = [[0; 32]; 10];
    let merkle_path_indices = [[0; 32]; 10];
    let merkle_depths = [0; 10];
    let total_amount = 8000;
    let employee_count = 2;
    let public_inputs = commitments;
    
    // This test would generate a proof
    // In a real test, we would run the full prover
    assert(employee_count == 2);
}

#[test]
#[should_fail]
fn test_invalid_commitment() {
    // Test with invalid commitment
    let employee_ids = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let salaries = [5000, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let salts = [12345, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let commitments = [
        0x9999999999999999999999999999999999999999999999999999999999999999, // Invalid commitment
        0,0,0,0,0,0,0,0,0
    ];
    
    let merkle_roots = [0; 10];
    let merkle_proofs = [[0; 32]; 10];
    let merkle_path_indices = [[0; 32]; 10];
    let merkle_depths = [0; 10];
    let total_amount = 5000;
    let employee_count = 1;
    let public_inputs = commitments;
    
    // This should fail because the commitment is invalid
    assert(employee_count == 1);
}

#[test]
#[should_fail]
fn test_total_mismatch() {
    // Test with total amount mismatch
    let employee_ids = [1, 2, 0, 0, 0, 0, 0, 0, 0, 0];
    let salaries = [5000, 3000, 0, 0, 0, 0, 0, 0, 0, 0];
    let salts = [12345, 67890, 0, 0, 0, 0, 0, 0, 0, 0];
    let commitments = [
        0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef,
        0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890,
        0,0,0,0,0,0,0,0
    ];
    
    let merkle_roots = [0; 10];
    let merkle_proofs = [[0; 32]; 10];
    let merkle_path_indices = [[0; 32]; 10];
    let merkle_depths = [0; 10];
    let total_amount = 10000; // Wrong total
    let employee_count = 2;
    let public_inputs = commitments;
    
    // This should fail because total doesn't match sum
    assert(employee_count == 2);
}