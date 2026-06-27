import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateProof() {
    console.log('🔧 Generating proof using Noir JS + BarretenbergBackend...');
    
    try {
        const projectRoot = process.cwd();
        const targetDir = path.join(projectRoot, 'circuits/payroll/target');
        
        const circuitPath = path.join(targetDir, 'payroll.json');
        if (!fs.existsSync(circuitPath)) {
            console.error(`❌ Circuit not found at: ${circuitPath}`);
            console.error('Run "yarn circuits:build" first.');
            return;
        }
        
        const circuitArtifact = JSON.parse(fs.readFileSync(circuitPath, 'utf-8'));
        console.log('✅ Circuit loaded');
        
        const proverTomlPath = path.join(projectRoot, 'circuits/payroll/Prover.toml');
        if (!fs.existsSync(proverTomlPath)) {
            console.error(`❌ Prover.toml not found at: ${proverTomlPath}`);
            return;
        }
        
        const proverToml = fs.readFileSync(proverTomlPath, 'utf-8');
        const inputs = parseToml(proverToml);
        console.log('✅ Inputs loaded:', Object.keys(inputs));
        
        console.log('\n📊 Input types:');
        for (const [key, value] of Object.entries(inputs)) {
            if (Array.isArray(value)) {
                console.log(`  ${key}: Array(length=${value.length}, type=${typeof value})`);
                if (value.length > 0) {
                    console.log(`    First element: ${value[0]}`);
                }
            } else {
                console.log(`  ${key}: ${typeof value} = ${value}`);
            }
        }
        
        const formattedInputs = formatInputsForNoir(inputs);
        
        console.log('\n✅ Formatted inputs ready');
        
        const backend = new BarretenbergBackend(circuitArtifact);
        const noir = new Noir(circuitArtifact);
        console.log('✅ Backend and Noir created');
        
        console.log('📊 Executing circuit...');
        const { witness } = await noir.execute(formattedInputs);
        console.log('✅ Witness generated');
        
        console.log('📜 Generating proof...');
        const proofData = await backend.generateProof(witness);
        console.log('✅ Proof generated');
        
        const proofPath = path.join(targetDir, 'proof');
        fs.writeFileSync(proofPath, proofData.proof);
        console.log(`📁 Proof saved to: ${proofPath} (${proofData.proof.length} bytes)`);
        
        let pubPath: string | null = null;
        if (proofData.publicInputs) {
            pubPath = path.join(targetDir, 'public_inputs.json');
            fs.writeFileSync(pubPath, JSON.stringify(proofData.publicInputs, null, 2));
            console.log(`📁 Public inputs saved to: ${pubPath}`);
        }
        
        console.log('🔑 Getting verification key...');
        const vk = await backend.getVerificationKey();
        const vkPath = path.join(targetDir, 'vk');
        fs.writeFileSync(vkPath, vk);
        console.log(`📁 Verification key saved to: ${vkPath} (${vk.length} bytes)`);
        
        console.log('✅ Verifying proof...');
        const isValid = await backend.verifyProof(proofData);
        console.log(`Base Proof verification: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
        
        await backend.destroy();
        
        console.log('\n🎉 All done!');
        console.log('📁 Files generated:');
        console.log(`  - ${proofPath}`);
        console.log(`  - ${vkPath}`);
        if (pubPath) {
            console.log(`  - ${pubPath}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
        }
    }
}

// 💡 FIXED: Assigns directly to the object property instead of returning early from the loop block
function formatInputsForNoir(inputs: Record<string, any>): Record<string, any> {
    const fieldKeys = new Set(['employee_ids', 'salts', 'commitments']);
    const formatted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(inputs)) {
        if (Array.isArray(value)) {
            formatted[key] = value.map(item => {
                if (fieldKeys.has(key)) {
                    if (typeof item === 'bigint') return `0x${item.toString(16)}`;
                    return item.toString(); 
                }
                return Number(item);
            });
        } else {
            if (fieldKeys.has(key)) {
                if (typeof value === 'bigint') {
                    formatted[key] = `0x${value.toString(16)}`;
                } else {
                    formatted[key] = value.toString();
                }
            } else {
                formatted[key] = Number(value);
            }
        }
    }
    
    return formatted;
}

function parseToml(toml: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = toml.split('\n');
    
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('#')) {
            i++;
            continue;
        }
        
        if (trimmed.includes('=') && trimmed.includes('[') && !trimmed.includes(']')) {
            const eqIndex = trimmed.indexOf('=');
            const key = trimmed.substring(0, eqIndex).trim();
            const arrayItems: any[] = [];
            
            i++;
            let foundEnd = false;
            while (i < lines.length && !foundEnd) {
                const currentLine = lines[i].trim();
                if (currentLine === ']') {
                    foundEnd = true;
                    break;
                }
                if (currentLine && !currentLine.startsWith('#')) {
                    let item = currentLine.replace(/,?$/, '').trim();
                    if (item) {
                        arrayItems.push(parseValue(item));
                    }
                }
                i++;
            }
            result[key] = arrayItems;
            i++;
            continue;
        }
        
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) {
            i++;
            continue;
        }
        
        const key = trimmed.substring(0, eqIndex).trim();
        let valueStr = trimmed.substring(eqIndex + 1).trim();
        
        if (valueStr.includes('#')) {
            valueStr = valueStr.substring(0, valueStr.indexOf('#')).trim();
        }
        
        result[key] = parseValue(valueStr);
        i++;
    }
    
    return result;
}

function parseValue(valueStr: string): any {
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
        const inner = valueStr.substring(1, valueStr.length - 1).trim();
        if (inner === '') {
            return [];
        }
        const items = inner.split(',').map(v => v.trim()).filter(v => v);
        return items.map(v => parseValue(v));
    }
    
    if ((valueStr.startsWith('"') && valueStr.endsWith('"')) || 
        (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
        return valueStr.substring(1, valueStr.length - 1);
    }
    
    if (valueStr === 'true') return true;
    if (valueStr === 'false') return false;
    
    if (valueStr.startsWith('0x')) {
        return valueStr; 
    }
    
    const num = Number(valueStr);
    if (!isNaN(num)) {
        return num;
    }
    
    return valueStr;
}

generateProof();
