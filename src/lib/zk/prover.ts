/**
 * prover.ts — ZetaPay payroll circuit prover.
 *
 * Key design changes vs. the old implementation
 * ──────────────────────────────────────────────
 * 1. No MAX_EMPLOYEES constant anywhere in this file.
 *    The circuit's capacity is read at runtime from its compiled ABI parameter
 *    `employee_ids` (an array type whose `.length` field is the circuit's limit).
 *    If the circuit is recompiled with a larger constant the TypeScript
 *    automatically inherits that larger capacity — zero code changes needed.
 *
 * 2. All input arrays are built at exactly `employees.length` items.
 *    Padding to the circuit's declared width only happens inside
 *    `buildCircuitInputs`, where it is strictly necessary for the circuit ABI,
 *    and is driven entirely by the ABI-sourced capacity rather than any
 *    hardcoded literal.
 *
 * 3. The validate guard throws a descriptive error referencing the circuit's
 *    actual capacity, making the limit transparent to callers.
 */

import { Noir }                  from '@noir-lang/noir_js';
import { BarretenbergBackend }   from '@noir-lang/backend_barretenberg';
import type { InputMap }         from '@noir-lang/noirc_abi';
import type { CompiledCircuit }  from '@noir-lang/types';

import {
  generateCommitment,
  buildMerkleTree,
  toFieldHex,
  ZERO_FIELD_HEX,
  MERKLE_DEPTH,
} from './merkle';

// ProofResult (bare) is re-exported for legacy callers.
// FullProofResult additionally carries the circuit input map so callers
// can extract merkleRoot, commitments, and per-employee proof paths for
// the Soroban contract payload without re-running the prover.
import type { ProofResult } from '@/types/zk';

export interface FullProofResult extends ProofResult {
  circuitInputs: PayrollCircuitInputs;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface EmployeeInput {
  id:     bigint;
  salary: bigint;
  salt:   bigint;
}

export interface PayrollCircuitInputs {
  employee_ids:          string[];
  salaries:              string[];
  salts:                 string[];
  commitments:           string[];
  merkle_roots:          string[];
  merkle_proofs:         string[][];
  merkle_path_indices:   string[][];
  merkle_depths:         number[];
  total_amount:          string;
  employee_count:        number;
  public_inputs:         string[];
}

// ---------------------------------------------------------------------------
// Circuit artifact loading
// ---------------------------------------------------------------------------

let _circuitCache: Promise<CompiledCircuit> | null = null;

/** Lazily load the compiled payroll circuit (cached for the page lifetime). */
export function loadPayrollCircuit(): Promise<CompiledCircuit> {
  if (!_circuitCache) {
    _circuitCache = import('@/lib/zk/circuits/payroll.json').then(
      (m) => m.default as CompiledCircuit,
    );
  }
  return _circuitCache;
}

// ---------------------------------------------------------------------------
// ABI introspection — read circuit capacity without any hardcoded constant
// ---------------------------------------------------------------------------

/**
 * Return the array length of the `employee_ids` parameter as declared in the
 * compiled circuit's ABI.  This is the circuit's compile-time MAX_EMPLOYEES.
 *
 * Throws if the ABI does not contain a compatible `employee_ids` entry —
 * this would indicate the circuit artifact is out of sync with the prover.
 */
function readCircuitCapacity(circuit: CompiledCircuit): number {
  // The Noir ABI represents fixed-size arrays as:
  //   { name: "employee_ids", type: { kind: "array", length: N, type: { kind: "field" } } }
  const param = (circuit.abi.parameters as Array<{ name: string; type: { kind: string; length?: number } }>)
    .find((p) => p.name === 'employee_ids');

  if (!param) {
    throw new Error(
      'Circuit ABI does not contain an `employee_ids` parameter. ' +
      'Ensure the payroll.json artifact is up to date.',
    );
  }
  if (param.type.kind !== 'array' || typeof param.type.length !== 'number') {
    throw new Error(
      `Circuit ABI parameter \`employee_ids\` is not a fixed-size array ` +
      `(found kind="${param.type.kind}"). Re-compile the payroll circuit.`,
    );
  }
  return param.type.length;
}

// ---------------------------------------------------------------------------
// Zero-value sentinels (circuit-compatible)
// ---------------------------------------------------------------------------

const ZERO_FIELD = ZERO_FIELD_HEX;
const ZERO_U64   = '0';
const ZERO_DEPTH = 0;
const ZERO_PROOF = Array<string>(MERKLE_DEPTH).fill(ZERO_FIELD);
const ZERO_PATH  = Array<string>(MERKLE_DEPTH).fill(ZERO_FIELD);

// ---------------------------------------------------------------------------
// Main prover class
// ---------------------------------------------------------------------------

export class ZetaPayProver {
  /** Warm the circuit artifact cache before proof generation. */
  static preloadCircuit(): Promise<CompiledCircuit> {
    return loadPayrollCircuit();
  }

  /**
   * Build the full circuit input map for `employees`.
   *
   * - Accepts any batch size from 1 up to the circuit's compile-time capacity.
   * - Padding to the circuit's declared width is driven solely by the ABI,
   *   with no hardcoded numeric literals.
   * - The padding slots satisfy the circuit's constraint that padding IDs,
   *   salaries, and commitments must all be zero.
   */
  static async buildCircuitInputs(
    employees:    EmployeeInput[],
    circuit?:     CompiledCircuit,
  ): Promise<PayrollCircuitInputs> {
    if (employees.length === 0) {
      throw new Error('Employee batch must contain at least one entry.');
    }

    const artifact      = circuit ?? await loadPayrollCircuit();
    const circuitWidth  = readCircuitCapacity(artifact);

    if (employees.length > circuitWidth) {
      throw new Error(
        `Batch of ${employees.length} employees exceeds this circuit's ` +
        `compiled capacity of ${circuitWidth}. ` +
        `Re-compile the Noir circuit with a larger MAX_EMPLOYEES constant.`,
      );
    }

    // ── Step 1: Compute Poseidon2 commitments for every active employee ──────
    const activeCommitments: string[] = [];
    for (const emp of employees) {
      activeCommitments.push(await generateCommitment(emp.id, emp.salary, emp.salt));
    }

    // ── Step 2: Build the Merkle tree from those commitments ─────────────────
    const tree = await buildMerkleTree(activeCommitments);

    // ── Step 3: Build padded arrays of exactly circuitWidth ──────────────────
    const employee_ids:        string[]   = [];
    const salaries:            string[]   = [];
    const salts:               string[]   = [];
    const commitments:         string[]   = [];
    const public_inputs:       string[]   = [];
    const merkle_roots:        string[]   = [];
    const merkle_proofs:       string[][] = [];
    const merkle_path_indices: string[][] = [];
    const merkle_depths:       number[]   = [];

    let calculatedTotal = BigInt(0);

    for (let i = 0; i < circuitWidth; i++) {
      if (i < employees.length) {
        const emp        = employees[i];
        const commitment = activeCommitments[i];

        employee_ids.push(toFieldHex(emp.id));
        salaries.push(emp.salary.toString());
        salts.push(toFieldHex(emp.salt));
        commitments.push(commitment);
        public_inputs.push(commitment);
        merkle_roots.push(tree.root);

        merkle_proofs.push(tree.proofs[i]);
        merkle_path_indices.push(
          tree.path_indices[i].map((bit) =>
            bit === 1 ? toFieldHex(BigInt(1)) : ZERO_FIELD,
          ),
        );
        merkle_depths.push(tree.depths[i]);

        calculatedTotal += emp.salary;
      } else {
        // Padding slot — all zeros; satisfies circuit padding constraints.
        employee_ids.push(ZERO_FIELD);
        salaries.push(ZERO_U64);
        salts.push(ZERO_FIELD);
        commitments.push(ZERO_FIELD);
        public_inputs.push(ZERO_FIELD);
        merkle_roots.push(ZERO_FIELD);
        merkle_proofs.push([...ZERO_PROOF]);
        merkle_path_indices.push([...ZERO_PATH]);
        merkle_depths.push(ZERO_DEPTH);
      }
    }

    return {
      employee_ids,
      salaries,
      salts,
      commitments,
      merkle_roots,
      merkle_proofs,
      merkle_path_indices,
      merkle_depths,
      total_amount:   calculatedTotal.toString(),
      employee_count: employees.length,
      public_inputs,
    };
  }

  /**
   * Execute the payroll circuit and produce a Barretenberg proof.
   *
   * Returns a `FullProofResult` which includes:
   *   - `proof`         : raw Barretenberg proof bytes
   *   - `publicInputs`  : BN254 Fr commitments (one per active employee)
   *   - `circuitInputs` : the full input map used to generate the proof,
   *                       exposing `merkle_roots`, `commitments`,
   *                       `merkle_proofs`, and `total_amount` so the caller
   *                       can forward them to the Soroban contract payload
   *                       without a second prover run.
   */
  static async generatePayrollProof(employees: EmployeeInput[]): Promise<FullProofResult> {
    const circuitArtifact = await loadPayrollCircuit();
    const inputs          = await this.buildCircuitInputs(employees, circuitArtifact);

    const backend = new BarretenbergBackend(circuitArtifact);
    const noir    = new Noir(circuitArtifact);

    try {
      const { witness } = await noir.execute(inputs as unknown as InputMap);
      const result      = await backend.generateProof(witness);

      return {
        proof:         result.proof,
        publicInputs:  result.publicInputs as string[],
        circuitInputs: inputs,
      };
    } finally {
      await backend.destroy();
    }
  }
}
