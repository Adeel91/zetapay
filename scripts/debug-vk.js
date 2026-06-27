// scripts/debug-vk.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function debugVK() {
    const targetDir = path.join(__dirname, '../circuits/payroll/target');
    const vkRaw = fs.readFileSync(path.join(targetDir, 'vk'));
    
    console.log(`📊 VK file size: ${vkRaw.length} bytes`);
    console.log(`📊 Hex dump (first 256 bytes):`);
    
    const hex = Array.from(vkRaw.slice(0, 256))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
    
    // Group by 32 bytes (field elements)
    console.log('\n📊 Grouped by 32 bytes (field elements):');
    for (let i = 0; i < Math.min(256, vkRaw.length); i += 32) {
        const chunk = Array.from(vkRaw.slice(i, Math.min(i + 32, vkRaw.length)));
        const hexChunk = chunk.map(b => b.toString(16).padStart(2, '0')).join(' ');
        console.log(`  [${i.toString().padStart(3)}]: ${hexChunk}`);
    }
    
    console.log(`\n📊 Total chunks: ${Math.ceil(vkRaw.length / 32)}`);
    
    // Try to detect G1 points (64 bytes = 2 field elements)
    console.log('\n📊 Grouped by 64 bytes (G1 points):');
    for (let i = 0; i < Math.min(512, vkRaw.length); i += 64) {
        if (i + 64 <= vkRaw.length) {
            const chunk = Array.from(vkRaw.slice(i, i + 64));
            const hexChunk = chunk.map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.log(`  [${i.toString().padStart(3)}]: ${hexChunk.substring(0, 60)}...`);
        }
    }
}

debugVK();