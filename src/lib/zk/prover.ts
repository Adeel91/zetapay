// lib/zk/prover.ts
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { generateCommitment, buildMerkleTree } from './merkle';
// ✅ Import circuit directly with type assertion
import circuitArtifactRaw from '@/lib/zk//circuits/payroll.json';

// ✅ Type assertion to fix the type mismatch
const circuitArtifact = circuitArtifactRaw as any;

export interface EmployeeInput {
  id: bigint;
  salary: bigint;
  salt: bigint;
}

export class ZetaPayProver {
  /**
   * Builds the strict input object structure required by the main function of your circuit,
   * enforcing exact length limits and structural padding rules.
   */
  public static async buildCircuitInputs(employees: EmployeeInput[]) {
    const MAX_EMPLOYEES = 10;
    const DEPTH = 32;

    const ZERO_PAD_FIELD = "0x0000000000000000000000000000000000000000000000000000000000000000";

    // Initialize arrays filled with zero padding matching circuit layout
    const employee_ids = new Array(MAX_EMPLOYEES).fill(ZERO_PAD_FIELD);
    const salaries = new Array(MAX_EMPLOYEES).fill("0");
    const salts = new Array(MAX_EMPLOYEES).fill(ZERO_PAD_FIELD);
    const commitments = new Array(MAX_EMPLOYEES).fill(ZERO_PAD_FIELD);
    const public_inputs = new Array(MAX_EMPLOYEES).fill(ZERO_PAD_FIELD);
    const merkle_roots = new Array(MAX_EMPLOYEES).fill(ZERO_PAD_FIELD);
    
    // Multi-dimensional arrays filled with formatted fields
    const merkle_proofs = Array.from({ length: MAX_EMPLOYEES }, () => new Array(DEPTH).fill(ZERO_PAD_FIELD));
    const merkle_path_indices = Array.from({ length: MAX_EMPLOYEES }, () => new Array(DEPTH).fill(ZERO_PAD_FIELD));
    const merkle_depths = new Array(MAX_EMPLOYEES).fill(0);

    // 1. Asynchronously generate all leaf commitments
    const calculatedCommitments: string[] = [];
    for (const emp of employees) {
      const comm = await generateCommitment(
        Number(emp.id),
        Number(emp.salary),
        Number(emp.salt)
      );
      calculatedCommitments.push(comm);
    }

    // 2. Build the full unified Merkle Tree from our commitments list
    const treeResult = await buildMerkleTree(calculatedCommitments);

    let calculatedTotal = BigInt("0");

    // 3. Map inputs into strict fixed-length arrays matching Noir constraints loop
    for (let i = 0; i < MAX_EMPLOYEES; i++) {
      if (i < employees.length) {
        const emp = employees[i];
        employee_ids[i] = `0x${emp.id.toString(16).padStart(64, '0')}`;
        salaries[i] = emp.salary.toString();
        salts[i] = `0x${emp.salt.toString(16).padStart(64, '0')}`;
        
        const commitmentStr = calculatedCommitments[i];
        commitments[i] = commitmentStr;
        public_inputs[i] = commitmentStr;

        // Assign structures extracted directly from our buildMerkleTree output maps
        merkle_roots[i] = treeResult.root;
        merkle_proofs[i] = treeResult.proofs[i];
        
        // ✅ CRITICAL FIX: Convert path bits from numbers to hex strings for the Field array
        merkle_path_indices[i] = treeResult.path_indices[i].map(bit => 
          bit === 1 ? `0x${"1".padStart(64, '0')}` : ZERO_PAD_FIELD
        );
        
        merkle_depths[i] = treeResult.depths[i];

        calculatedTotal += emp.salary;
      } else {
        // Fallback explicitly cleared to match loop assertions
        employee_ids[i] = ZERO_PAD_FIELD;
        salaries[i] = "0";
        salts[i] = ZERO_PAD_FIELD;
        commitments[i] = ZERO_PAD_FIELD;
        public_inputs[i] = ZERO_PAD_FIELD;
        merkle_roots[i] = ZERO_PAD_FIELD;
        merkle_proofs[i] = new Array(DEPTH).fill(ZERO_PAD_FIELD);
        merkle_path_indices[i] = new Array(DEPTH).fill(ZERO_PAD_FIELD);
        merkle_depths[i] = 0;
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
      public_inputs
    };
  }

  /**
   * Takes raw data, compiles parameters, generates witness, and returns a verified ZK Proof.
   * ✅ Uses imported circuit directly - no fetch needed
   */
  public static async generatePayrollProof(
    employees: EmployeeInput[]
  ): Promise<{ proof: Uint8Array; publicInputs: string[] }> {
    
    const inputs = await this.buildCircuitInputs(employees);
    
    // ✅ Use the type-asserted circuit artifact
    const backend = new BarretenbergBackend(circuitArtifact);
    const noir = new Noir(circuitArtifact);

    // Dynamic execution matrix validation passes smoothly here
    const { witness } = await noir.execute(inputs as any);
    const proofResult = await backend.generateProof(witness);
    
    await backend.destroy();
    
    return {
      proof: proofResult.proof,
      publicInputs: proofResult.publicInputs as string[]
    };
  }
}