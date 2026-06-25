import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import type { InputMap } from '@noir-lang/noirc_abi';
import type { CompiledCircuit } from '@noir-lang/types';
import { generateCommitment, buildMerkleTree, toFieldHex, ZERO_FIELD_HEX } from './merkle';
import type { ProofResult } from '@/types/zk';

const MAX_EMPLOYEES = 10;
const MERKLE_DEPTH = 32;

export interface EmployeeInput {
  id: bigint;
  salary: bigint;
  salt: bigint;
}

export interface PayrollCircuitInputs {
  employee_ids: string[];
  salaries: string[];
  salts: string[];
  commitments: string[];
  merkle_roots: string[];
  merkle_proofs: string[][];
  merkle_path_indices: string[][];
  merkle_depths: number[];
  total_amount: string;
  employee_count: number;
  public_inputs: string[];
}

let circuitLoadPromise: Promise<CompiledCircuit> | null = null;

/**
 * Lazily load the compiled payroll circuit (async chunk / download friendly for Turbopack).
 */
export async function loadPayrollCircuit(): Promise<CompiledCircuit> {
  if (!circuitLoadPromise) {
    circuitLoadPromise = import('@/lib/zk/circuits/payroll.json').then(
      (module) => module.default as CompiledCircuit,
    );
  }
  return circuitLoadPromise;
}

export class ZetaPayProver {
  /**
   * Warm the circuit artifact cache before proof generation.
   */
  public static preloadCircuit(): Promise<CompiledCircuit> {
    return loadPayrollCircuit();
  }

  /**
   * Build the fixed-size input object expected by the Noir `main` loop.
   */
  public static async buildCircuitInputs(
    employees: EmployeeInput[],
  ): Promise<PayrollCircuitInputs> {
    if (employees.length === 0 || employees.length > MAX_EMPLOYEES) {
      throw new Error(`Employee count must be between 1 and ${MAX_EMPLOYEES}`);
    }

    const employee_ids = Array(MAX_EMPLOYEES).fill(ZERO_FIELD_HEX);
    const salaries = Array(MAX_EMPLOYEES).fill('0');
    const salts = Array(MAX_EMPLOYEES).fill(ZERO_FIELD_HEX);
    const commitments = Array(MAX_EMPLOYEES).fill(ZERO_FIELD_HEX);
    const public_inputs = Array(MAX_EMPLOYEES).fill(ZERO_FIELD_HEX);
    const merkle_roots = Array(MAX_EMPLOYEES).fill(ZERO_FIELD_HEX);
    const merkle_proofs = Array.from({ length: MAX_EMPLOYEES }, () =>
      Array(MERKLE_DEPTH).fill(ZERO_FIELD_HEX),
    );
    const merkle_path_indices = Array.from({ length: MAX_EMPLOYEES }, () =>
      Array(MERKLE_DEPTH).fill(ZERO_FIELD_HEX),
    );
    const merkle_depths = Array(MAX_EMPLOYEES).fill(0);

    const calculatedCommitments: string[] = [];
    for (const employee of employees) {
      const commitment = await generateCommitment(employee.id, employee.salary, employee.salt);
      calculatedCommitments.push(commitment);
    }

    const treeResult = await buildMerkleTree(calculatedCommitments);

    let calculatedTotal = BigInt(0);

    for (let index = 0; index < MAX_EMPLOYEES; index++) {
      if (index < employees.length) {
        const employee = employees[index];

        employee_ids[index] = toFieldHex(employee.id);
        salaries[index] = employee.salary.toString();
        salts[index] = toFieldHex(employee.salt);

        const commitment = calculatedCommitments[index];
        commitments[index] = commitment;
        public_inputs[index] = commitment;

        merkle_roots[index] = treeResult.root;
        merkle_proofs[index] = treeResult.proofs[index];
        merkle_path_indices[index] = treeResult.path_indices[index].map((bit) =>
          bit === 1 ? toFieldHex(BigInt(1)) : ZERO_FIELD_HEX,
        );
        merkle_depths[index] = treeResult.depths[index];

        calculatedTotal += employee.salary;
      } else {
        employee_ids[index] = ZERO_FIELD_HEX;
        salaries[index] = '0';
        salts[index] = ZERO_FIELD_HEX;
        commitments[index] = ZERO_FIELD_HEX;
        public_inputs[index] = ZERO_FIELD_HEX;
        merkle_roots[index] = ZERO_FIELD_HEX;
        merkle_proofs[index] = Array(MERKLE_DEPTH).fill(ZERO_FIELD_HEX);
        merkle_path_indices[index] = Array(MERKLE_DEPTH).fill(ZERO_FIELD_HEX);
        merkle_depths[index] = 0;
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
      total_amount: calculatedTotal.toString(),
      employee_count: employees.length,
      public_inputs,
    };
  }

  /**
   * Execute the payroll circuit and produce a Barretenberg proof.
   */
  public static async generatePayrollProof(employees: EmployeeInput[]): Promise<ProofResult> {
    const [inputs, circuitArtifact] = await Promise.all([
      this.buildCircuitInputs(employees),
      loadPayrollCircuit(),
    ]);

    const backend = new BarretenbergBackend(circuitArtifact);
    const noir = new Noir(circuitArtifact);

    try {
      const { witness } = await noir.execute(inputs as unknown as InputMap);
      const proofResult = await backend.generateProof(witness);

      return {
        proof: proofResult.proof,
        publicInputs: proofResult.publicInputs as string[],
      };
    } finally {
      await backend.destroy();
    }
  }
}
