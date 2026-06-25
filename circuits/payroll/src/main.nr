// ZetaPay Payroll ZK Circuit
// Proves salary commitments, total amount consistency, and Merkle tree membership.
use dep::std;

// Constants
global MAX_EMPLOYEES: u32 = 10;
// Changed constants to u64 for direct comparison
global MAX_SALARY: u64 = 1000000;
global MIN_SALARY: u64 = 1;

// Pedersen hash for BN254 compatibility
fn pedersen_hash_3(inputs: [Field; 3]) -> Field {
    std::hash::pedersen_hash(inputs)
}

fn pedersen_hash_2(inputs: [Field; 2]) -> Field {
    std::hash::pedersen_hash(inputs)
}

// Generate a salary commitment: commitment = hash(employee_id, salary, salt)
// Casts salary to a Field inside the hash input array
fn generate_commitment(employee_id: Field, salary: u64, salt: Field) -> Field {
    let inputs = [employee_id, salary as Field, salt];
    pedersen_hash_3(inputs)
}

// Verify Merkle proof for a single leaf
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
            
            if path_bit == 0 {
                current = pedersen_hash_2([current, sibling]);
            } else {
                current = pedersen_hash_2([sibling, current]);
            }
        }
    }
    
    current == root
}

// Main circuit function
fn main(
    // Private Employee Data - Salaries updated to u64
    employee_ids: [Field; MAX_EMPLOYEES],
    salaries: [u64; MAX_EMPLOYEES],
    salts: [Field; MAX_EMPLOYEES],
    
    // Public Commitments & Merkle Proofs for Validation
    commitments: pub [Field; MAX_EMPLOYEES],
    merkle_roots: [Field; MAX_EMPLOYEES],
    merkle_proofs: [[Field; 32]; MAX_EMPLOYEES],
    merkle_path_indices: [[Field; 32]; MAX_EMPLOYEES],
    merkle_depths: [u32; MAX_EMPLOYEES],
    
    // Public inputs for Soroban Smart Contract verification binding - Updated to u64
    total_amount: pub u64,
    employee_count: pub u32,
    public_inputs: pub [Field; MAX_EMPLOYEES],
) {
    // 1. Validate employee count boundaries
    assert(employee_count <= MAX_EMPLOYEES, "Too many employees");
    assert(employee_count > 0, "No employees provided");
    
    // 2. Validate total amount (Works directly now that total_amount is u64)
    assert(total_amount > 0, "Total amount must be greater than 0");
    
    let mut calculated_total: u64 = 0;
    
    // 3. Process each employee slot safely inside a static loop
    for idx in 0..MAX_EMPLOYEES {
        if idx < employee_count {
            let employee_id = employee_ids[idx];
            let salary = salaries[idx];
            let salt = salts[idx];
            let commitment = commitments[idx];
            let merkle_root = merkle_roots[idx];
            let merkle_proof = merkle_proofs[idx];
            let merkle_path_indices = merkle_path_indices[idx];
            let merkle_depth = merkle_depths[idx];
            
            // 3a. Validate salary range (Works directly now that salary is u64)
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
            calculated_total += salary;
            
            // 3e. Verify public inputs align with the processed commitments
            assert(public_inputs[idx] == commitment, "Public input mismatch");
        } else {
            // Constrain unused padding slots to prevent front-running manipulations
            assert(employee_ids[idx] == 0, "Padding ID must be zero");
            assert(salaries[idx] == 0, "Padding salary must be zero");
            assert(commitments[idx] == 0, "Padding commitment must be zero");
            assert(public_inputs[idx] == 0, "Padding public input must be zero");
        }
    }
    
    // 4. Verify total amount matches sum
    assert(calculated_total == total_amount, "Total amount mismatch");
}
