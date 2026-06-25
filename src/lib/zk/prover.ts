// lib/zk/prover.ts
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import circuit from '@/lib/zk/circuits/payroll.json';
import { EmployeeProofInput, ProofResult } from '@/types/zk';

export class ZKProver {
    private backend: BarretenbergBackend | null = null;
    private noir: Noir | null = null;
    private initialized: boolean = false;

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // @ts-ignore
            this.backend = new BarretenbergBackend(circuit);
            // @ts-ignore
            this.noir = new Noir(circuit, this.backend);
            this.initialized = true;
            console.log('✅ ZK Prover initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ZK Prover:', error);
            throw new Error('Failed to initialize ZK Prover');
        }
    }

    async generateProof(inputs: EmployeeProofInput): Promise<ProofResult> {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!this.noir || !this.backend) {
            throw new Error('Noir execution engine components not initialized');
        }

        try {
            // Format path_indices as 2D array for Noir
            const rawPathIndices = inputs.merkle_path_indices as unknown as any[];
            const structuredPathIndices: string[][] = [];

            if (Array.isArray(rawPathIndices)) {
                for (const subArray of rawPathIndices) {
                    if (Array.isArray(subArray)) {
                        const row: string[] = subArray.map((v: any) => String(v));
                        while (row.length < 32) row.push("0");
                        structuredPathIndices.push(row);
                    }
                }
            }

            while (structuredPathIndices.length < 10) {
                structuredPathIndices.push(Array(32).fill("0"));
            }

            // Build proof inputs
            const proofInputs: any = {
                employee_ids: inputs.employee_ids.map(id => String(id)),
                salaries: inputs.salaries.map(salary => Number(salary)), 
                salts: inputs.salts.map(salt => String(salt)),
                commitments: inputs.commitments.map(c => String(c)),
                merkle_roots: inputs.merkle_roots.map(root => String(root)),
                merkle_proofs: inputs.merkle_proofs.map(proofArr => proofArr.map(p => String(p))),
                merkle_path_indices: structuredPathIndices,
                merkle_depths: inputs.merkle_depths.map(depth => Number(depth)),
                total_amount: Number(inputs.total_amount),
                employee_count: Number(inputs.employee_count),
                public_inputs: inputs.public_inputs.map(pi => String(pi)),
            };

            // ✅ DEBUG: Log the first commitment
            console.log('🔍 First commitment:', proofInputs.commitments[0]);
            console.log('🔍 First salary:', proofInputs.salaries[0]);
            console.log('🔍 First salt:', proofInputs.salts[0]);
            console.log('🔍 Employee count:', proofInputs.employee_count);
            console.log('🔍 Total amount:', proofInputs.total_amount);

            // @ts-ignore
            const { witness } = await this.noir.execute(proofInputs);
            
            // @ts-ignore
            const proofResult = await this.backend.generateProof(witness);
            
            return {
                proof: proofResult.proof,
                publicInputs: proofResult.publicInputs || [],
            };
        } catch (error) {
            console.error('Proof generation failed:', error);
            throw new Error('Failed to generate ZK proof: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    async verifyProof(proof: Uint8Array, publicInputs: string[]): Promise<boolean> {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!this.backend) {
            throw new Error('Backend not initialized');
        }

        try {
            // @ts-ignore
            return await this.backend.verifyProof({ proof, publicInputs });
        } catch (error) {
            console.error('Proof verification failed:', error);
            return false;
        }
    }
}

let proverInstance: ZKProver | null = null;

export async function getProver(): Promise<ZKProver> {
    if (!proverInstance) {
        proverInstance = new ZKProver();
        await proverInstance.initialize();
    }
    return proverInstance;
}