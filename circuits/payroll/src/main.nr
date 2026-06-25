// ZetaPay Payroll ZK Circuit
// ✅ PURE PROTOCOL 26: Poseidon2 with BN254

use dep::std;

// Constants
global MAX_EMPLOYEES: u32 = 10;
global MAX_SALARY: u64 = 1000000;
global MIN_SALARY: u64 = 1;

// ✅ Protocol 26: Poseidon2 permutation over 4 elements
fn poseidon2_hash_3(employee_id: Field, salary: Field, salt: Field) -> Field {
    let state = [employee_id, salary, salt, 0];
    let permuted = std::hash::poseidon2_permutation(state, 4);
    permuted[0]
}

fn poseidon2_hash_2(left: Field, right: Field) -> Field {
    let state = [left, right, 0, 0];
    let permuted = std::hash::poseidon2_permutation(state, 4);
    permuted[0]
}

// ✅ Circuit computes REAL commitment from raw data
fn generate_commitment(employee_id: Field, salary: u64, salt: Field) -> Field {
    poseidon2_hash_3(employee_id, salary as Field, salt)
}

// ✅ Real Merkle tree verification with Poseidon2
fn verify_merkle_proof(
    root: Field,
    leaf: Field,
    proof: [Field; 32],
    path_indices: [Field; 32],
    depth: u32
) -> bool {
    let mut current = leaf;
    
    for idx in 0..32 {
        if idx < depth {
            let sibling = proof[idx];
            let path_bit = path_indices[idx];
            
            current = if path_bit == 0 {
                poseidon2_hash_2(current, sibling)
            } else {
                poseidon2_hash_2(sibling, current)
            };
        }
    }
    
    current == root
}

// ✅ Main circuit
fn main(
    // Private inputs - raw employee data
    employee_ids: [Field; MAX_EMPLOYEES],
    salaries: [u64; MAX_EMPLOYEES],
    salts: [Field; MAX_EMPLOYEES],
    
    // Public inputs - commitments from frontend
    commitments: pub [Field; MAX_EMPLOYEES],
    merkle_roots: [Field; MAX_EMPLOYEES],
    merkle_proofs: [[Field; 32]; MAX_EMPLOYEES],
    merkle_path_indices: [[Field; 32]; MAX_EMPLOYEES],
    merkle_depths: [u32; MAX_EMPLOYEES],
    total_amount: pub u64,
    employee_count: pub u32,
    public_inputs: pub [Field; MAX_EMPLOYEES],
) {
    assert(employee_count <= MAX_EMPLOYEES, "Too many employees");
    assert(employee_count > 0, "No employees provided");
    assert(total_amount > 0, "Total amount must be greater than 0");
    
    let mut calculated_total: u64 = 0;
    
    for idx in 0..MAX_EMPLOYEES {
        if idx < employee_count {
            let employee_id = employee_ids[idx];
            let salary = salaries[idx];
            let salt = salts[idx];
            let merkle_root = merkle_roots[idx];
            let merkle_proof = merkle_proofs[idx];
            let merkle_path_indices = merkle_path_indices[idx];
            let merkle_depth = merkle_depths[idx];
            
            assert(salary >= MIN_SALARY, "Salary below minimum");
            assert(salary <= MAX_SALARY, "Salary exceeds maximum");
            
            // ✅ Verify the commitment matches what frontend passed
            let computed_commitment = generate_commitment(employee_id, salary, salt);
            assert(computed_commitment == commitments[idx], "Invalid commitment");
            
            // ✅ Verify Merkle proof with the computed commitment
            let merkle_valid = verify_merkle_proof(
                merkle_root,
                computed_commitment,
                merkle_proof,
                merkle_path_indices,
                merkle_depth
            );
            assert(merkle_valid, "Invalid Merkle proof");
            
            calculated_total += salary;
            
            // ✅ Public inputs must match commitments
            assert(public_inputs[idx] == computed_commitment, "Public input mismatch");
        } else {
            assert(employee_ids[idx] == 0, "Padding ID must be zero");
            assert(salaries[idx] == 0, "Padding salary must be zero");
            assert(commitments[idx] == 0, "Padding commitment must be zero");
            assert(public_inputs[idx] == 0, "Padding public input must be zero");
        }
    }
    
    assert(calculated_total == total_amount, "Total amount mismatch");
}

#[test]
fn test_1_employee() {
    let employee_ids = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let salaries = [5000, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let salts = [12345, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    let commitment = generate_commitment(1, 5000, 12345);
    let mut commitments = [0; 10];
    commitments[0] = commitment;
    
    let mut public_inputs = [0; 10];
    public_inputs[0] = commitment;
    
    let merkle_roots = [0; 10];
    let merkle_proofs = [[0; 32]; 10];
    let merkle_path_indices = [[0; 32]; 10];
    let merkle_depths = [0; 10];
    let total_amount = 5000;
    let employee_count = 1;
    
    main(
        employee_ids,
        salaries,
        salts,
        commitments,
        merkle_roots,
        merkle_proofs,
        merkle_path_indices,
        merkle_depths,
        total_amount,
        employee_count,
        public_inputs
    );
}

#[test]
#[should_fail]
fn test_invalid_commitment() {
    let employee_ids = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let salaries = [5000, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let salts = [12345, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    // ❌ Wrong commitment
    let commitments = [999, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let public_inputs = commitments;
    
    let merkle_roots = [0; 10];
    let merkle_proofs = [[0; 32]; 10];
    let merkle_path_indices = [[0; 32]; 10];
    let merkle_depths = [0; 10];
    let total_amount = 5000;
    let employee_count = 1;
    
    main(
        employee_ids,
        salaries,
        salts,
        commitments,
        merkle_roots,
        merkle_proofs,
        merkle_path_indices,
        merkle_depths,
        total_amount,
        employee_count,
        public_inputs
    );
}

#[test]
#[should_fail]
fn test_total_mismatch() {
    let employee_ids = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let salaries = [5000, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let salts = [12345, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    let commitment = generate_commitment(1, 5000, 12345);
    let mut commitments = [0; 10];
    commitments[0] = commitment;
    
    let mut public_inputs = [0; 10];
    public_inputs[0] = commitment;
    
    let merkle_roots = [0; 10];
    let merkle_proofs = [[0; 32]; 10];
    let merkle_path_indices = [[0; 32]; 10];
    let merkle_depths = [0; 10];
    let total_amount = 9999; // ❌ Wrong total
    let employee_count = 1;
    
    main(
        employee_ids,
        salaries,
        salts,
        commitments,
        merkle_roots,
        merkle_proofs,
        merkle_path_indices,
        merkle_depths,
        total_amount,
        employee_count,
        public_inputs
    );
}

#[test]
#[should_fail]
fn test_invalid_merkle_proof() {
    let employee_ids = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let salaries = [5000, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let salts = [12345, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    let commitment = generate_commitment(1, 5000, 12345);
    let mut commitments = [0; 10];
    commitments[0] = commitment;
    
    let mut public_inputs = [0; 10];
    public_inputs[0] = commitment;
    
    // ❌ Wrong merkle root
    let merkle_roots = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let merkle_proofs = [[0; 32]; 10];
    let merkle_path_indices = [[0; 32]; 10];
    let merkle_depths = [0; 10];
    let total_amount = 5000;
    let employee_count = 1;
    
    main(
        employee_ids,
        salaries,
        salts,
        commitments,
        merkle_roots,
        merkle_proofs,
        merkle_path_indices,
        merkle_depths,
        total_amount,
        employee_count,
        public_inputs
    );
}