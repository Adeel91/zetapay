import { Barretenberg, BN254_FR_MODULUS, fieldToString } from '@aztec/bb.js';
import { MerkleTreeResult } from '@/types/zk';

const FIELD_BYTE_LENGTH = 32;
const MAX_EMPLOYEES = 10;
const MAX_DEPTH = 32;

export const ZERO_FIELD_HEX =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

let bb: Barretenberg | null = null;

async function getBB(): Promise<Barretenberg> {
  if (!bb) {
    bb = await Barretenberg.new();
  }
  return bb;
}

/**
 * Encode a BN254 field element as the 32-byte big-endian buffer bb.js expects.
 */
export function fieldToBytes(value: bigint | number | string): Uint8Array {
  let n: bigint;

  if (typeof value === 'bigint') {
    n = value;
  } else if (typeof value === 'number') {
    n = BigInt(value);
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
      n = BigInt(trimmed);
    } else {
      n = BigInt(trimmed);
    }
  } else {
    n = BigInt(0);
  }

  n = ((n % BN254_FR_MODULUS) + BN254_FR_MODULUS) % BN254_FR_MODULUS;

  const bytes = new Uint8Array(FIELD_BYTE_LENGTH);
  for (let i = FIELD_BYTE_LENGTH - 1; i >= 0; i--) {
    bytes[i] = Number(n & BigInt(0xff));
    n >>= BigInt(8);
  }
  return bytes;
}

/**
 * Convert a 32-byte field buffer into a canonical 0x-prefixed 64-char hex string.
 */
export function bytesToFieldHex(bytes: Uint8Array): string {
  const slice = bytes.length >= FIELD_BYTE_LENGTH ? bytes.slice(0, FIELD_BYTE_LENGTH) : bytes;
  const hex = fieldToString(slice, 16).padStart(64, '0');
  return `0x${hex}`;
}

/**
 * Normalize any supported field representation to canonical hex.
 */
export function toFieldHex(value: bigint | number | string | Uint8Array): string {
  if (value instanceof Uint8Array) {
    return bytesToFieldHex(value);
  }
  return bytesToFieldHex(fieldToBytes(value));
}

/**
 * Run Poseidon2 permutation (Protocol 26 / BN254) over exactly four field elements.
 * Returns permuted[0] as canonical hex, matching Noir's `permuted[0]` indexing.
 */
async function poseidon2Permute(fields: Array<bigint | number | string>): Promise<string> {
  if (fields.length !== 4) {
    throw new Error('Poseidon2 permutation requires exactly four field inputs');
  }

  const b = await getBB();
  const inputs = fields.map((field) => fieldToBytes(field));

  const response = await b.poseidon2Permutation({ inputs });
  const permuted = response.outputs[0];

  if (!permuted || permuted.length === 0) {
    throw new Error('Poseidon2 permutation returned an empty output state');
  }

  return bytesToFieldHex(permuted);
}

/**
 * Matches Noir `generate_commitment`:
 * poseidon2_permutation([employee_id, salary, salt, 0]) -> permuted[0]
 */
export async function generateCommitment(
  employeeId: number | bigint,
  salary: number | bigint,
  salt: number | bigint,
): Promise<string> {
  return poseidon2Permute([employeeId, salary, salt, 0]);
}

/**
 * Matches Noir `poseidon2_hash_2`:
 * poseidon2_permutation([left, right, 0, 0]) -> permuted[0]
 */
export async function poseidon2Hash(left: string, right: string): Promise<string> {
  return poseidon2Permute([left, right, 0, 0]);
}

/**
 * Build a dynamic Merkle tree (up to 10 leaves, padded proofs to depth 32).
 */
export async function buildMerkleTree(leaves: string[]): Promise<MerkleTreeResult> {
  if (leaves.length === 0) {
    return {
      root: ZERO_FIELD_HEX,
      proofs: Array.from({ length: MAX_EMPLOYEES }, () => Array(MAX_DEPTH).fill(ZERO_FIELD_HEX)),
      path_indices: Array.from({ length: MAX_EMPLOYEES }, () => Array(MAX_DEPTH).fill(0)),
      depths: Array(MAX_EMPLOYEES).fill(0),
    };
  }

  const normalizedLeaves = leaves.map((leaf) => toFieldHex(leaf));
  const tree: string[][] = [normalizedLeaves];

  while (tree[tree.length - 1].length > 1) {
    const currentLevel = tree[tree.length - 1];
    const nextLevel: string[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      nextLevel.push(await poseidon2Hash(left, right));
    }

    tree.push(nextLevel);
  }

  const root = tree[tree.length - 1][0] ?? ZERO_FIELD_HEX;
  const depth = tree.length - 1;

  const proofs: string[][] = [];
  const pathIndices: number[][] = [];
  const depths: number[] = [];

  for (let leafIndex = 0; leafIndex < leaves.length; leafIndex++) {
    const proof: string[] = [];
    const path: number[] = [];
    let index = leafIndex;

    for (let level = 0; level < depth; level++) {
      const levelNodes = tree[level];
      const isRightNode = index % 2 === 1;
      const siblingIndex = isRightNode ? index - 1 : index + 1;

      proof.push(
        siblingIndex < levelNodes.length ? levelNodes[siblingIndex] : levelNodes[index],
      );
      path.push(isRightNode ? 1 : 0);
      index = Math.floor(index / 2);
    }

    while (proof.length < MAX_DEPTH) {
      proof.push(ZERO_FIELD_HEX);
    }
    while (path.length < MAX_DEPTH) {
      path.push(0);
    }

    proofs.push(proof);
    pathIndices.push(path);
    depths.push(depth);
  }

  while (proofs.length < MAX_EMPLOYEES) {
    proofs.push(Array(MAX_DEPTH).fill(ZERO_FIELD_HEX));
    pathIndices.push(Array(MAX_DEPTH).fill(0));
    depths.push(0);
  }

  return { root, proofs, path_indices: pathIndices, depths };
}
