// ZetaPay Payroll ZK Circuit
// Protocol 26 — Poseidon2 permutation over BN254 Fr (std::hash::poseidon2_permutation)
//
// MAX_EMPLOYEES is a compile-time capacity bound, not a business rule.
// • Increase it and run `nargo compile` to raise the per-batch ceiling.
// • The TypeScript prover (prover.ts) reads this limit from the compiled ABI
//   automatically via `circuit.abi.parameters.find(p => p.name === "employee_ids")`
//   so no TypeScript constant needs updating after recompilation.
//
// Current capacity: 1024 employees per batch.
// Recommended recompile values: 256 | 512 | 1024 | 2048

use dep::std;

global MAX_EMPLOYEES: u32 = 1024;

global MAX_SALARY: u64 = 1_000_000_000; // 1 billion micro-USDC (~$1M per employee)
global MIN_SALARY: u64 = 1;             // 1 micro-USDC minimum

// ---------------------------------------------------------------------------
// Poseidon2 helpers (matching frontend merkle.ts exactly)
// ---------------------------------------------------------------------------

/// Poseidon2 commitment: poseidon2_permutation([employee_id, salary, salt, 0])[0]
fn generate_commitment(employee_id: Field, salary: u64, salt: Field) -> Field {
    let state   = [employee_id, salary as Field, salt, 0];
    let permuted = std::hash::poseidon2_permutation(state, 4);
    permuted[0]
}

/// Merkle node hash: poseidon2_permutation([left, right, 0, 0])[0]
fn poseidon2_hash_2(left: Field, right: Field) -> Field {
    let state   = [left, right, 0, 0];
    let permuted = std::hash::poseidon2_permutation(state, 4);
    permuted[0]
}

// ---------------------------------------------------------------------------
// Merkle path verification (32-deep fixed path, variable depth via `depth` arg)
// ---------------------------------------------------------------------------

fn verify_merkle_proof(
    root:         Field,
    leaf:         Field,
    proof:        [Field; 32],
    path_indices: [Field; 32],
    depth:        u32,
) -> bool {
    let mut current = leaf;

    for idx in 0..32 {
        if idx < depth {
            let sibling  = proof[idx];
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

// ---------------------------------------------------------------------------
// Main circuit
//
// Private inputs (witness):  employee_ids, salaries, salts, merkle_roots,
//                            merkle_proofs, merkle_path_indices, merkle_depths
// Public  inputs (output):   commitments, total_amount, employee_count,
//                            public_inputs
//
// All arrays have length MAX_EMPLOYEES.  Slots at index >= employee_count are
// padding and are NOT asserted — the circuit simply skips them.  This means
// the frontend may leave padding slots as any value without triggering a
// constraint failure; what matters is that active slots are correctly formed.
// ---------------------------------------------------------------------------

fn main(
    // ── Private witness ──
    employee_ids:        [Field; MAX_EMPLOYEES],
    salaries:            [u64;  MAX_EMPLOYEES],
    salts:               [Field; MAX_EMPLOYEES],

    merkle_roots:        [Field; MAX_EMPLOYEES],
    merkle_proofs:       [[Field; 32]; MAX_EMPLOYEES],
    merkle_path_indices: [[Field; 32]; MAX_EMPLOYEES],
    merkle_depths:       [u32;  MAX_EMPLOYEES],

    // ── Public outputs ──
    commitments:    pub [Field; MAX_EMPLOYEES],
    total_amount:   pub u64,
    employee_count: pub u32,
    public_inputs:  pub [Field; MAX_EMPLOYEES],
) {
    assert(employee_count > 0,                   "batch must have at least one employee");
    assert(employee_count <= MAX_EMPLOYEES,       "batch exceeds circuit capacity");
    assert(total_amount   > 0,                   "total amount must be positive");

    let mut calculated_total: u64 = 0;

    for idx in 0..MAX_EMPLOYEES {
        if idx < employee_count {
            let employee_id  = employee_ids[idx];
            let salary       = salaries[idx];
            let salt         = salts[idx];
            let merkle_root  = merkle_roots[idx];
            let proof_path   = merkle_proofs[idx];
            let path_bits    = merkle_path_indices[idx];
            let depth        = merkle_depths[idx];

            assert(salary >= MIN_SALARY, "salary below minimum");
            assert(salary <= MAX_SALARY, "salary exceeds maximum");

            // Recompute commitment from raw witness and check it matches the
            // public commitment supplied by the frontend.
            let computed = generate_commitment(employee_id, salary, salt);
            assert(computed == commitments[idx],   "commitment mismatch for active slot");
            assert(computed == public_inputs[idx], "public input mismatch for active slot");

            // Verify the Merkle path for this employee's commitment.
            let merkle_ok = verify_merkle_proof(merkle_root, computed, proof_path, path_bits, depth);
            assert(merkle_ok, "invalid Merkle proof for active slot");

            calculated_total += salary;
        }
        // Padding slots (idx >= employee_count): no assertions.
        // The frontend prover fills them with zeros which are harmless.
    }

    assert(calculated_total == total_amount, "total amount does not match salary sum");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[test]
fn test_single_employee() {
    let mut employee_ids        = [0; MAX_EMPLOYEES];
    let mut salaries            = [0; MAX_EMPLOYEES];
    let mut salts               = [0; MAX_EMPLOYEES];
    let mut merkle_roots        = [0; MAX_EMPLOYEES];
    let mut merkle_proofs       = [[0; 32]; MAX_EMPLOYEES];
    let mut merkle_path_indices = [[0; 32]; MAX_EMPLOYEES];
    let mut merkle_depths       = [0; MAX_EMPLOYEES];
    let mut commitments         = [0; MAX_EMPLOYEES];
    let mut public_inputs       = [0; MAX_EMPLOYEES];

    employee_ids[0] = 1;
    salaries[0]     = 5000;
    salts[0]        = 12345;

    let c = generate_commitment(1, 5000, 12345);
    commitments[0]   = c;
    public_inputs[0] = c;
    // merkle_root = 0, depth = 0 → verify_merkle_proof returns (current == 0), which
    // fails if leaf != 0.  For testing without a real tree, use depth = 0 and
    // set merkle_root[0] to the leaf commitment directly.
    merkle_roots[0]  = c;
    merkle_depths[0] = 0;

    main(
        employee_ids, salaries, salts,
        merkle_roots, merkle_proofs, merkle_path_indices, merkle_depths,
        commitments, 5000, 1, public_inputs,
    );
}

#[test]
#[should_fail]
fn test_wrong_commitment_fails() {
    let mut employee_ids        = [0; MAX_EMPLOYEES];
    let mut salaries            = [0; MAX_EMPLOYEES];
    let mut salts               = [0; MAX_EMPLOYEES];
    let mut merkle_roots        = [0; MAX_EMPLOYEES];
    let mut merkle_proofs       = [[0; 32]; MAX_EMPLOYEES];
    let mut merkle_path_indices = [[0; 32]; MAX_EMPLOYEES];
    let mut merkle_depths       = [0; MAX_EMPLOYEES];
    let mut commitments         = [0; MAX_EMPLOYEES];
    let mut public_inputs       = [0; MAX_EMPLOYEES];

    employee_ids[0] = 1;
    salaries[0]     = 5000;
    salts[0]        = 12345;
    commitments[0]  = 999;   // deliberately wrong
    public_inputs[0]= 999;

    main(
        employee_ids, salaries, salts,
        merkle_roots, merkle_proofs, merkle_path_indices, merkle_depths,
        commitments, 5000, 1, public_inputs,
    );
}

#[test]
#[should_fail]
fn test_wrong_total_fails() {
    let mut employee_ids        = [0; MAX_EMPLOYEES];
    let mut salaries            = [0; MAX_EMPLOYEES];
    let mut salts               = [0; MAX_EMPLOYEES];
    let mut merkle_roots        = [0; MAX_EMPLOYEES];
    let mut merkle_proofs       = [[0; 32]; MAX_EMPLOYEES];
    let mut merkle_path_indices = [[0; 32]; MAX_EMPLOYEES];
    let mut merkle_depths       = [0; MAX_EMPLOYEES];
    let mut commitments         = [0; MAX_EMPLOYEES];
    let mut public_inputs       = [0; MAX_EMPLOYEES];

    employee_ids[0]  = 1;
    salaries[0]      = 5000;
    salts[0]         = 12345;
    let c            = generate_commitment(1, 5000, 12345);
    commitments[0]   = c;
    public_inputs[0] = c;
    merkle_roots[0]  = c;

    main(
        employee_ids, salaries, salts,
        merkle_roots, merkle_proofs, merkle_path_indices, merkle_depths,
        commitments, 9999, 1, public_inputs, // wrong total
    );
}
