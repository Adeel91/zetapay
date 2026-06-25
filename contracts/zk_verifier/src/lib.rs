#![no_std]
#![allow(clippy::too_many_arguments)]

use soroban_sdk::{contract, contractimpl, Bytes, BytesN, Env, Vec};

#[contract]
pub struct ZKVerifier;

#[contractimpl]
impl ZKVerifier {
    pub fn verify_batch(
        env: Env,
        commitments: Vec<BytesN<32>>,
        amounts: Vec<i128>,
        total_amount: i128,
        proof: Bytes,
        _public_inputs: Vec<BytesN<32>>,
        merkle_root: BytesN<32>,
        merkle_proofs: Vec<Vec<BytesN<32>>>,
        merkle_indices: Vec<u64>,
    ) -> bool {
        if total_amount <= 0 {
            return false;
        }

        let total_commitments = commitments.len();
        if total_commitments == 0 || amounts.len() != total_commitments {
            return false;
        }

        let mut calculated_total = 0;
        for i in 0..amounts.len() {
            calculated_total += amounts.get(i).unwrap();
        }

        if calculated_total != total_amount {
            return false;
        }

        for i in 0..total_commitments {
            let commitment = commitments.get(i).unwrap();
            if !Self::verify_commitment(&env, commitment) {
                return false;
            }
        }

        for i in 0..total_commitments {
            let commitment = commitments.get(i).unwrap();
            let proof_vec = merkle_proofs.get(i).unwrap();
            let index = merkle_indices.get(i).unwrap();
            if !Self::verify_merkle_proof(&env, merkle_root.clone(), commitment, proof_vec, index) {
                return false;
            }
        }

        if proof.is_empty() {
            return false;
        }

        true
    }

    pub fn verify_commitment(_env: &Env, commitment: BytesN<32>) -> bool {
        let mut all_zeros = true;
        let bytes_array = commitment.to_array();

        for byte in bytes_array.iter() {
            if *byte != 0 {
                all_zeros = false;
                break;
            }
        }
        !all_zeros
    }

    pub fn verify_merkle_proof(
        env: &Env,
        root: BytesN<32>,
        leaf: BytesN<32>,
        proof: Vec<BytesN<32>>,
        index: u64,
    ) -> bool {
        let mut current = leaf;
        let mut idx = index;
        let proof_len = proof.len();

        for i in 0..proof_len {
            let sibling = proof.get(i).unwrap();
            let mut combined = [0u8; 64];

            if idx.is_multiple_of(2) {
                combined[0..32].copy_from_slice(&current.to_array());
                combined[32..64].copy_from_slice(&sibling.to_array());
            } else {
                combined[0..32].copy_from_slice(&sibling.to_array());
                combined[32..64].copy_from_slice(&current.to_array());
            }

            let combined_bytes = Bytes::from_array(env, &combined);
            let hash_bytes = env.crypto().sha256(&combined_bytes);
            current = BytesN::from_array(env, &hash_bytes.to_array());
            idx >>= 1;
        }

        current == root
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{BytesN, Env};

    #[test]
    fn test_verify_commitment() {
        let env = Env::default();
        let commitment = BytesN::from_array(&env, &[1u8; 32]);
        assert!(ZKVerifier::verify_commitment(&env, commitment));
    }

    #[test]
    fn test_verify_commitment_zero() {
        let env = Env::default();
        let commitment = BytesN::from_array(&env, &[0u8; 32]);
        assert!(!ZKVerifier::verify_commitment(&env, commitment));
    }
}
