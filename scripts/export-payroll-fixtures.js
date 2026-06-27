// scripts/export-payroll-fixtures.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportFixtures() {
    console.log('📤 Exporting payroll fixtures to Rust...');
    
    const targetDir = path.join(__dirname, '../circuits/payroll/target');
    const fixturesPath = path.join(__dirname, '../contracts/zk-verifier/src/fixtures.rs');
    
    try {
        const publicInputsPath = path.join(targetDir, 'public_inputs.json');
        if (!fs.existsSync(publicInputsPath)) {
            throw new Error(`Missing public inputs file at ${publicInputsPath}`);
        }
        const publicInputs = JSON.parse(fs.readFileSync(publicInputsPath, 'utf-8'));
        const proofRaw = fs.readFileSync(path.join(targetDir, 'proof'));

        // Parse the proof
        const proof = parseProof(proofRaw);
        
        // Parse public inputs
        const signals = parsePublicInputs(publicInputs);
        
        // Generate Rust code with only proof and signals
        const rustCode = generateRustCode(proof, signals);
        fs.writeFileSync(fixturesPath, rustCode);
        
        console.log(`\n✅ Export complete!`);
        console.log(`📊 Signals: ${signals.length}`);
        console.log(`📁 Saved to: ${fixturesPath}\n`);
    } catch (error) {
        console.error('❌ Export failed:', error);
        process.exit(1);
    }
}

function parseProof(proofBuffer) {
    const view = new Uint8Array(proofBuffer);
    let offset = 0;
    
    const a = Array.from(view.slice(offset, offset + 64));
    offset += 64;
    
    const b = Array.from(view.slice(offset, offset + 128));
    offset += 128;
    
    const c = Array.from(view.slice(offset, offset + 64));
    
    return { a, b, c };
}

function parsePublicInputs(publicInputs) {
    return publicInputs.map(input => {
        const bytes = new Array(32).fill(0);
        const value = typeof input === 'string' ? BigInt(input) : BigInt(input);
        const hexStr = value.toString(16).padStart(64, '0');
        for (let i = 0; i < 32; i++) {
            bytes[i] = parseInt(hexStr.substring(i * 2, i * 2 + 2), 16);
        }
        return bytes;
    });
}

function formatArrayLines(arr, itemsPerLine = 16) {
    const lines = [];
    for (let i = 0; i < arr.length; i += itemsPerLine) {
        const chunk = arr.slice(i, Math.min(i + itemsPerLine, arr.length));
        lines.push('    ' + chunk.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', '));
    }
    return lines.join(',\n');
}

function generateRustCode(proof, signals) {
    return `// AUTO-GENERATED from payroll circuit
// Run 'yarn circuits:export' to regenerate
#![allow(dead_code)]
#![allow(clippy::all)]

// PROOF COMPONENTS
pub const PROOF_A: [u8; 64] = [
${formatArrayLines(proof.a)}
];

pub const PROOF_B: [u8; 128] = [
${formatArrayLines(proof.b)}
];

pub const PROOF_C: [u8; 64] = [
${formatArrayLines(proof.c)}
];

// PUBLIC SIGNALS
pub const SIGNALS: [[u8; 32]; ${signals.length}] = [
${signals.map(signal => `    [\n${formatArrayLines(signal, 16)}\n    ]`).join(',\n')}
];
`;
}

exportFixtures();