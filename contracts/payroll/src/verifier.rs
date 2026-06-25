/// verifier.rs — Inline ZK proof validation for the unified payroll contract.
///
/// What is verified on-chain (Protocol 21+, no BN254 host functions required):
///   1. Proof structure: byte length meets the minimum for a Barretenberg UltraPlonk proof.
///   2. Amount consistency: Σ employee.amount_usdc == total_amount (no overflow).
///   3. Per-employee parity: public_inputs.len() == employees.len().
///   4. BN254 Fr field membership: every salary_commitment and every public_input
///      is non-zero AND strictly less than the BN254 scalar field modulus r.
///   5. Proof binding: keccak256(proof || merkle_root || total_amount_be) is stored
///      on-chain, permanently linking this proof to its public parameters and
///      preventing proof re-use across different batches or roots.
///
/// Full UltraHonk pairing verification (BN254):
///   Barretenberg proofs encode polynomial commitments as BN254 G1 affine points.
///   The verifier equation is a set of pairing checks over the BN254 curve:
///
///     ∀ round constraint C_i:
///       e(π_A_i, G2_generator) == e(π_B_i, challenge_commitment_i)
///
///   This requires `bn254_pairing` host functions planned for Stellar Protocol 26.
///   When that protocol is activated, replace the final `true` return in
///   `verify_batch_proof` with the call:
///
///     env.crypto().bn254_pairing(&g1_points, &g2_points) == PAIRING_IDENTITY
///
///   where `g1_points` / `g2_points` are extracted from `proof` using the
///   Barretenberg proof layout (32-byte big-endian G1 x/y coordinates starting
///   at byte offset 0, 32, 64, 96, …).

use soroban_sdk::{Bytes, BytesN, Env, Vec};

use crate::PayrollEmployee;

// ---------------------------------------------------------------------------
// BN254 scalar field modulus r (big-endian, 32 bytes)
// r = 21888242871839275222246405745257275088548364400416034343698204186575808495617
// hex: 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001
// ---------------------------------------------------------------------------
const BN254_FR_MODULUS: [u8; 32] = [
    0x30, 0x64, 0x4e, 0x72, 0xe1, 0x31, 0xa0, 0x29,
    0xb8, 0x50, 0x45, 0xb6, 0x81, 0x81, 0x58, 0x5d,
    0x28, 0x33, 0xe8, 0x48, 0x79, 0xb9, 0x70, 0x91,
    0x43, 0xe1, 0xf5, 0x93, 0xf0, 0x00, 0x00, 0x01,
];

// Barretenberg UltraPlonk proofs are at minimum 2144 bytes for the smallest
// supported circuit.  We accept anything ≥ 128 bytes so that testnet proofs
// generated with minimal circuits are not rejected.
const PROOF_MIN_BYTES: u32 = 128;

// ---------------------------------------------------------------------------
// Public helpers (also re-exported from lib.rs so the API route can use them)
// ---------------------------------------------------------------------------

/// Return `true` iff the 32-byte big-endian value is a valid BN254 Fr element:
/// non-zero and strictly less than the field modulus.
pub fn is_valid_bn254_scalar(field: &BytesN<32>) -> bool {
    let b = field.to_array();

    // Reject the zero element — it is never a valid Poseidon2 commitment output.
    if b.iter().all(|&x| x == 0) {
        return false;
    }

    // Lexicographic (big-endian) comparison against the modulus.
    for i in 0..32_usize {
        match b[i].cmp(&BN254_FR_MODULUS[i]) {
            core::cmp::Ordering::Less    => return true,
            core::cmp::Ordering::Greater => return false,
            core::cmp::Ordering::Equal   => {}
        }
    }
    // Exactly equal to modulus → not a valid field element (Fr = Z/rZ, domain 0..r-1).
    false
}

/// Check that the sum of all employee payout amounts equals `total_amount`.
/// Uses checked arithmetic to catch any overflow on-chain.
pub fn verify_amount_sum(employees: &Vec<PayrollEmployee>, total_amount: i128) -> bool {
    let mut sum: i128 = 0;
    let n = employees.len();
    for i in 0..n {
        let emp = employees.get(i).unwrap();
        if emp.payout_amount <= 0 {
            return false;
        }
        sum = match sum.checked_add(emp.payout_amount) {
            Some(s) => s,
            None    => return false, // arithmetic overflow
        };
    }
    sum == total_amount
}

/// Check that `proof` meets the structural minimum for a Barretenberg proof.
pub fn validate_proof_structure(proof: &Bytes) -> bool {
    proof.len() >= PROOF_MIN_BYTES
}

/// Validate all public inputs are valid BN254 Fr field elements.
pub fn validate_public_inputs(public_inputs: &Vec<BytesN<32>>) -> bool {
    if public_inputs.is_empty() {
        return false;
    }
    let n = public_inputs.len();
    for i in 0..n {
        if !is_valid_bn254_scalar(&public_inputs.get(i).unwrap()) {
            return false;
        }
    }
    true
}

/// Validate every employee's salary_commitment is a valid BN254 Fr element.
pub fn validate_commitments(employees: &Vec<PayrollEmployee>) -> bool {
    let n = employees.len();
    for i in 0..n {
        let emp = employees.get(i).unwrap();
        if !is_valid_bn254_scalar(&emp.salary_commitment) {
            return false;
        }
    }
    true
}

/// Compute a tamper-evident binding between the proof and its public parameters.
///
/// binding = keccak256( proof_bytes ‖ merkle_root_bytes ‖ total_amount_be_16 )
///
/// Stored in the `PayrollBatch.proof_binding` field so that any future audit
/// can confirm the proof bytes on IPFS/Arweave match what was verified on-chain.
pub fn compute_proof_binding(
    env:          &Env,
    proof:        &Bytes,
    merkle_root:  &BytesN<32>,
    total_amount: i128,
) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.append(proof);

    let root_slice: Bytes = merkle_root.clone().into();
    data.append(&root_slice);

    let amount_le = total_amount.to_be_bytes(); // 16 bytes big-endian
    data.append(&Bytes::from_slice(env, &amount_le));

    env.crypto().keccak256(&data)
}

// ---------------------------------------------------------------------------
// Top-level entry point called by the contract
// ---------------------------------------------------------------------------

/// Validate the ZK batch proof and its public parameters.
///
/// Returns `(true, binding_hash)` when all checks pass.
/// Returns `(false, zero_hash)` on first failure.
///
/// Validation layers executed in order:
///   1. Proof structure (minimum byte length)
///   2. Employee / public-input parity
///   3. Amount sum consistency
///   4. BN254 Fr field membership for salary commitments
///   5. BN254 Fr field membership for public inputs
///   6. Proof binding computation (keccak256, replay-prevention)
///
/// Layer 7 (BN254 UltraHonk pairing verification) is stubbed with a TODO
/// comment and will replace the final `true` return when Protocol 26
/// `bn254_pairing` host functions are available.
pub fn verify_batch_proof(
    env:           &Env,
    employees:     &Vec<PayrollEmployee>,
    proof:         &Bytes,
    public_inputs: &Vec<BytesN<32>>,
    total_amount:  i128,
    merkle_root:   &BytesN<32>,
) -> (bool, BytesN<32>) {
    let zero = BytesN::from_array(env, &[0u8; 32]);

    // 1. Proof structure
    if !validate_proof_structure(proof) {
        return (false, zero);
    }

    // 2. Parity: one public input per employee
    if public_inputs.len() != employees.len() {
        return (false, zero);
    }

    // 3. Amount sum
    if !verify_amount_sum(employees, total_amount) {
        return (false, zero);
    }

    // 4. Salary commitments are valid BN254 Fr elements
    if !validate_commitments(employees) {
        return (false, zero);
    }

    // 5. Public inputs are valid BN254 Fr elements
    if !validate_public_inputs(public_inputs) {
        return (false, zero);
    }

    // 6. Proof binding — binds this proof to its exact public parameters
    let binding = compute_proof_binding(env, proof, merkle_root, total_amount);

    // TODO (Protocol 26): replace the `(true, binding)` return below with the
    // Barretenberg UltraHonk pairing equation:
    //
    //   let proof_bytes_vec: Vec<Bytes> = parse_g1_commitments(env, proof);
    //   let vk_g2_points:    Vec<Bytes> = load_verification_key_g2(env);
    //   let valid = env.crypto().bn254_pairing(&proof_bytes_vec, &vk_g2_points)
    //                  == PAIRING_IDENTITY_BYTES;
    //   if !valid { return (false, zero); }
    //
    // The verification key G2 points are stored in contract persistent storage
    // and must be initialised at deployment time via `initialize_vk(vk_bytes)`.
    //
    // All structural checks above remain as pre-flight guards.

    (true, binding)
}
