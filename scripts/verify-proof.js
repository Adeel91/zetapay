// scripts/verify-proof.js
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyProof() {
    console.log('🔍 Verifying proof with noir_js...');
    
    const targetDir = path.join(__dirname, '../circuits/payroll/target');
    
    try {
        // Load the circuit
        const circuitPath = path.join(targetDir, 'payroll.json');
        const circuitArtifact = JSON.parse(fs.readFileSync(circuitPath, 'utf-8'));
        
        // Load the proof and public inputs
        const proof = fs.readFileSync(path.join(targetDir, 'proof'));
        const publicInputs = JSON.parse(fs.readFileSync(path.join(targetDir, 'public_inputs.json'), 'utf-8'));
        const vk = fs.readFileSync(path.join(targetDir, 'vk'));
        
        console.log('📊 Proof size:', proof.length, 'bytes');
        console.log('📊 Public inputs:', publicInputs.length);
        console.log('📊 VK size:', vk.length, 'bytes');
        
        // Create backend
        const backend = new BarretenbergBackend(circuitArtifact);
        
        // Verify the proof
        const isValid = await backend.verifyProof({
            proof: proof,
            publicInputs: publicInputs
        });
        
        console.log(`\n✅ Proof verification: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
        
        await backend.destroy();
        
        return isValid;
    } catch (error) {
        console.error('❌ Verification error:', error);
        return false;
    }
}

verifyProof();