/**
 * merkle.ts — Poseidon2 / BN254 Merkle tree for ZetaPay payroll circuits.
 *
 * Design constraints
 * ──────────────────
 * • Uses Poseidon2 permutation (Protocol 26 / BN254) via @aztec/bb.js, matching
 *   the Noir circuit's `std::hash::poseidon2_permutation` exactly.
 * • Tree depth is always padded to MERKLE_DEPTH (32) so the circuit's fixed-size
 *   `[Field; 32]` proof arrays are always fully populated.
 * • Employee count is entirely dynamic — there is NO upper-bound imposed here.
 *   The only limit is the circuit's compile-time capacity, which is read from
 *   the ABI by prover.ts at proof-generation time.
 * • Zero-padding within a single proof path (depth < 32) uses ZERO_FIELD_HEX.
 * • Odd-length levels are handled by duplicating the last node (standard approach).
 */

import { Barretenberg, BN254_FR_MODULUS, fieldToString } from '@aztec/bb.js';
import type { MerkleTreeResult } from '@/types/zk';

export const FIELD_BYTE_LENGTH = 32;
export const MERKLE_DEPTH      = 32;

export const ZERO_FIELD_HEX =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

// ---------------------------------------------------------------------------
// Singleton Barretenberg instance
// ---------------------------------------------------------------------------

let _bb: Barretenberg | null = null;

async function getBB(): Promise<Barretenberg> {
  if (!_bb) {
    _bb = await Barretenberg.new();
  }
  return _bb;
}

// ---------------------------------------------------------------------------
// Field-element encoding / decoding
// ---------------------------------------------------------------------------

/**
 * Encode any numeric-like value as a 32-byte big-endian BN254 Fr element.
 * Reduces mod r automatically.
 */
export function fieldToBytes(value: bigint | number | string): Uint8Array {
  let n: bigint;

  if (typeof value === 'bigint') {
    n = value;
  } else if (typeof value === 'number') {
    n = BigInt(Math.trunc(value));
  } else {
    const t = value.trim();
    n = BigInt(t.startsWith('0x') || t.startsWith('0X') ? t : t || '0');
  }

  n = ((n % BN254_FR_MODULUS) + BN254_FR_MODULUS) % BN254_FR_MODULUS;

  const out = new Uint8Array(FIELD_BYTE_LENGTH);
  for (let i = FIELD_BYTE_LENGTH - 1; i >= 0; i--) {
    out[i] = Number(n & BigInt(0xff));
    n >>= BigInt(8);
  }
  return out;
}

/**
 * Convert a 32-byte field buffer to a canonical 0x-prefixed 64-hex-char string.
 */
export function bytesToFieldHex(bytes: Uint8Array): string {
  const slice = bytes.length >= FIELD_BYTE_LENGTH
    ? bytes.slice(0, FIELD_BYTE_LENGTH)
    : bytes;
  const hex = fieldToString(slice, 16).padStart(64, '0');
  return `0x${hex}`;
}

/**
 * Normalise any supported field representation to canonical 0x hex.
 */
export function toFieldHex(value: bigint | number | string | Uint8Array): string {
  if (value instanceof Uint8Array) return bytesToFieldHex(value);
  return bytesToFieldHex(fieldToBytes(value));
}

// ---------------------------------------------------------------------------
// Poseidon2 primitives (exact match to Noir circuit)
// ---------------------------------------------------------------------------

/**
 * Run one Poseidon2 permutation over exactly 4 field elements.
 * Returns `permuted[0]` as canonical hex — identical to Noir's
 *   `std::hash::poseidon2_permutation([a, b, c, d], 4)[0]`
 */
async function poseidon2Permute4(
  f0: bigint | number | string,
  f1: bigint | number | string,
  f2: bigint | number | string,
  f3: bigint | number | string,
): Promise<string> {
  const b      = await getBB();
  const inputs = [f0, f1, f2, f3].map(fieldToBytes);
  const res    = await b.poseidon2Permutation({ inputs });
  const out    = res.outputs[0];
  if (!out || out.length === 0) throw new Error('Poseidon2 permutation returned empty output');
  return bytesToFieldHex(out);
}

/**
 * Commitment hash — mirrors Noir `generate_commitment`:
 *   poseidon2_permutation([employee_id, salary, salt, 0])[0]
 */
export async function generateCommitment(
  employeeId: number | bigint,
  salary:     number | bigint,
  salt:       number | bigint,
): Promise<string> {
  return poseidon2Permute4(employeeId, salary, salt, 0);
}

/**
 * Node-pair hash — mirrors Noir `poseidon2_hash_2`:
 *   poseidon2_permutation([left, right, 0, 0])[0]
 */
export async function poseidon2Hash(left: string, right: string): Promise<string> {
  return poseidon2Permute4(left, right, 0, 0);
}

// ---------------------------------------------------------------------------
// Merkle tree construction
// ---------------------------------------------------------------------------

/**
 * Build a Poseidon2 Merkle tree over `leaves` and return:
 *   - `root`        : tree root as 0x hex
 *   - `proofs`      : one sibling-path per leaf, each padded to MERKLE_DEPTH (32)
 *   - `path_indices`: direction bits (0 = left, 1 = right) per level, padded to 32
 *   - `depths`      : actual tree depth for each leaf (same for all leaves; kept
 *                     per-leaf for compatibility with the circuit's `merkle_depths`
 *                     input array)
 *
 * No upper bound is imposed on `leaves.length` here.
 * Caller (prover.ts) validates against the circuit's compiled capacity.
 */
export async function buildMerkleTree(leaves: string[]): Promise<MerkleTreeResult> {
  if (leaves.length === 0) {
    return {
      root:         ZERO_FIELD_HEX,
      proofs:       [],
      path_indices: [],
      depths:       [],
    };
  }

  const normalised = leaves.map(toFieldHex);

  // Build every level bottom-up.
  const levels: string[][] = [normalised];

  while (levels[levels.length - 1].length > 1) {
    const cur  = levels[levels.length - 1];
    const next: string[] = [];

    for (let i = 0; i < cur.length; i += 2) {
      const left  = cur[i];
      const right = i + 1 < cur.length ? cur[i + 1] : cur[i]; // duplicate last
      next.push(await poseidon2Hash(left, right));
    }
    levels.push(next);
  }

  const root       = levels[levels.length - 1][0] ?? ZERO_FIELD_HEX;
  const treeDepth  = levels.length - 1; // actual depth of this tree (≤ 32)

  const proofs:       string[][] = [];
  const pathIndices:  number[][] = [];
  const depths:       number[]   = [];

  for (let leafIdx = 0; leafIdx < leaves.length; leafIdx++) {
    const siblings: string[] = [];
    const bits:     number[] = [];
    let   cursor             = leafIdx;

    // Walk from leaf level up to root, collecting siblings.
    for (let lvl = 0; lvl < treeDepth; lvl++) {
      const levelNodes = levels[lvl];
      const isRight    = cursor % 2 === 1;
      const siblingIdx = isRight ? cursor - 1 : cursor + 1;

      // If sibling does not exist (odd-length level), mirror the node itself.
      siblings.push(siblingIdx < levelNodes.length ? levelNodes[siblingIdx] : levelNodes[cursor]);
      bits.push(isRight ? 1 : 0);

      cursor = Math.floor(cursor / 2);
    }

    // Pad path to MERKLE_DEPTH so the circuit's `[Field; 32]` is always full.
    while (siblings.length < MERKLE_DEPTH) siblings.push(ZERO_FIELD_HEX);
    while (bits.length    < MERKLE_DEPTH) bits.push(0);

    proofs.push(siblings);
    pathIndices.push(bits);
    depths.push(treeDepth);
  }

  return { root, proofs, path_indices: pathIndices, depths };
}
