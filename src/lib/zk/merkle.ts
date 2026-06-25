import { Barretenberg } from '@aztec/bb.js';
import { MerkleTreeResult } from '@/types/zk';

let bb: Barretenberg | null = null;

async function getBB(): Promise<Barretenberg> {
  if (!bb) {
    bb = await Barretenberg.new();
  }
  return bb;
}

/**
 * ✅ Converts any value into a clean, 64-character hexadecimal string WITHOUT the '0x' prefix.
 * This is exactly what the internal bb.js 0.34.0 WASM JSON-RPC serializer expects.
 */
function toRawHex64(value: any): string {
  let num: bigint;
  if (typeof value === 'bigint') {
    num = value;
  } else if (typeof value === 'string') {
    const clean = value.startsWith('0x') ? value : '0x' + value;
    num = BigInt(clean);
  } else if (typeof value === 'number') {
    num = BigInt(value);
  } else if (value && typeof value.toBigInt === 'function') {
    num = value.toBigInt();
  } else if (value && typeof value.value === 'bigint') {
    num = value.value;
  } else {
    num = BigInt(0);
  }
  return num.toString(16).padStart(64, '0');
}

/**
 * ✅ Correctly handles the raw byte array output from poseidon2Permutation.
 * It slices out the first 32 bytes (permuted) and turns it into a standard 0x-prefixed hex string.
 */
function toCanonical(value: any): string {
  if (value === null || value === undefined) {
    return '0x' + BigInt(0).toString(16).padStart(64, '0');
  }

  // Handle true raw arrays of numbers or Uint8Array bytes returned by legacy WASM state
  if (Array.isArray(value) || value instanceof Uint8Array || (typeof value === 'object' && Array.isArray(Array.from(value || [])))) {
    const rawBytes = Array.from(value as any);
    
    // poseidon2Permutation returns the entire 4-element state (4 * 32 = 128 bytes)
    // We only want the first field element matching permuted in your Noir circuit
    const targetBytes = rawBytes.length >= 32 ? rawBytes.slice(0, 32) : rawBytes;

    const hex = targetBytes
      .map((b: any) => Number(b).toString(16).padStart(2, '0'))
      .join('');
    
    return '0x' + hex.padStart(64, '0');
  }

  if (typeof value === 'object') {
    if ('value' in value && value.value !== undefined) {
      return toCanonical(value.value);
    }
    if ('_value' in value && value._value !== undefined) {
      return toCanonical(value._value);
    }
    if ('toBigInt' in value && typeof value.toBigInt === 'function') {
      return '0x' + value.toBigInt().toString(16).padStart(64, '0');
    }
  }

  let num: bigint;
  if (typeof value === 'bigint') {
    num = value;
  } else if (typeof value === 'number') {
    num = BigInt(value);
  } else if (typeof value === 'string') {
    if (value === '') {
      num = BigInt(0);
    } else if (value.includes(',')) {
      const parts = value.split(',').map(x => parseInt(x.trim(), 10));
      return toCanonical(parts);
    } else {
      num = value.startsWith('0x') ? BigInt(value) : BigInt('0x' + value);
    }
  } else {
    num = BigInt(0);
  }

  return '0x' + num.toString(16).padStart(64, '0');
}

/**
 * ✅ Matches Noir's generate_commitment:
 * poseidon2_permutation([employee_id, salary, salt, 0])
 */
export async function generateCommitment(
  employeeId: number,
  salary: number,
  salt: number
): Promise<string> {
  const b = await getBB();
  
  // Format fields to non-prefixed hex strings to prevent serialization errors
  const f1 = toRawHex64(employeeId);
  const f2 = toRawHex64(salary);
  const f3 = toRawHex64(salt);
  const f4 = toRawHex64(0);
  
  // 0.34.0 Correct Wrap: Pass inputs array wrapped cleanly inside an object structure
  const result = await (b as any).poseidon2Permutation({ inputs: [f1, f2, f3, f4] });
  
  const outputs = result && result.value ? result.value : result;
  return toCanonical(outputs);
}

/**
 * ✅ Matches Noir's poseidon2_hash_2:
 * poseidon2_permutation([left, right, 0, 0])
 */
export async function poseidon2Hash(left: string, right: string): Promise<string> {
  const b = await getBB();
  
  const f1 = toRawHex64(left);
  const f2 = toRawHex64(right);
  const f3 = toRawHex64(0);
  const f4 = toRawHex64(0);
  
  // 0.34.0 Correct Wrap: Pass inputs array wrapped cleanly inside an object structure
  const result = await (b as any).poseidon2Permutation({ inputs: [f1, f2, f3, f4] });
  
  const outputs = result && result.value ? result.value : result;
  return toCanonical(outputs);
}

/**
 * ✅ Builds a full 32-depth Merkle tree with Poseidon2 over BN254
 */
export async function buildMerkleTree(leaves: string[]): Promise<MerkleTreeResult> {
  const MAX_EMPLOYEES = 10;
  const MAX_DEPTH = 32;

  const EMPTY_FIELD = '0x0000000000000000000000000000000000000000000000000000000000000000';

  if (leaves.length === 0) {
    return {
      root: EMPTY_FIELD,
      proofs: Array.from({ length: MAX_EMPLOYEES }, () => Array(MAX_DEPTH).fill(EMPTY_FIELD)),
      path_indices: Array.from({ length: MAX_EMPLOYEES }, () => Array(MAX_DEPTH).fill(0)),
      depths: Array(MAX_EMPLOYEES).fill(0),
    };
  }

  const normalized = leaves.map(l => toCanonical(l));
  const tree: string[][] = [normalized];

  while (tree[tree.length - 1].length > 1) {
    const cur = tree[tree.length - 1];
    const next: string[] = [];
    for (let i = 0; i < cur.length; i += 2) {
      const left = cur[i];
      const right = i + 1 < cur.length ? cur[i + 1] : left;
      next.push(await poseidon2Hash(left, right));
    }
    tree.push(next);
  }

  // ✅ CRITICAL TYPE FIX: Access index [0] to extract the string root value cleanly
  const root = (tree[tree.length - 1] && tree[tree.length - 1][0]) || EMPTY_FIELD;
  const depth = tree.length - 1;

  const proofs: string[][] = [];
  const pathIndices: number[][] = [];
  const depths: number[] = [];

  for (let i = 0; i < leaves.length; i++) {
    const proof: string[] = [];
    const path: number[] = [];
    let idx = i;
    for (let lvl = 0; lvl < depth; lvl++) {
      const level = tree[lvl];
      const isRight = idx % 2 === 1;
      const sibling = isRight ? idx - 1 : idx + 1;
      proof.push(sibling < level.length ? level[sibling] : level[idx]);
      path.push(isRight ? 1 : 0);
      idx = Math.floor(idx / 2);
    }
    while (proof.length < MAX_DEPTH) {
      proof.push(EMPTY_FIELD);
    }
    while (path.length < MAX_DEPTH) {
      path.push(0);
    }
    proofs.push(proof);
    pathIndices.push(path);
    depths.push(depth);
  }

  while (proofs.length < MAX_EMPLOYEES) {
    proofs.push(Array(MAX_DEPTH).fill(EMPTY_FIELD));
    pathIndices.push(Array(MAX_DEPTH).fill(0));
    depths.push(0);
  }

  return { root, proofs, path_indices: pathIndices, depths };
}
