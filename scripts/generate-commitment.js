// scripts/generate-commitment.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function extractCommitmentsFromTest() {
    try {
        const output = execSync(
            'cd circuits/payroll && nargo test generate_commitments --show-output',
            { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
        );
        
        const lines = output.split('\n');
        let collecting = false;
        const xlmCommits = [];
        const usdcCommits = [];
        let collectingUsdc = false;
        
        for (const line of lines) {
            if (line.includes('XLM COMMITMENTS')) {
                collecting = true;
                collectingUsdc = false;
                continue;
            }
            if (line.includes('USDC COMMITMENTS')) {
                collecting = false;
                collectingUsdc = true;
                continue;
            }
            if (line.includes('=====')) {
                continue;
            }
            
            let match = line.match(/^\s*"(0x[a-fA-F0-9]+)",?\s*$/);
            
            if (match && collecting) {
                xlmCommits.push(match[1]);
            }
            
            if (match && collectingUsdc) {
                usdcCommits.push(match[1]);
            }
        }
        
        return { xlmCommits, usdcCommits };
        
    } catch (error) {
        console.error('❌ Error running nargo test:', error.message);
        return null;
    }
}

function formatCommitments(commits, totalSlots = 10) {
    const lines = commits.slice(0, totalSlots).map(c => `    "${c}",`);
    const remaining = totalSlots - commits.length;
    for (let i = 0; i < remaining; i++) {
        lines.push(`    "0",`);
    }
    return lines.join('\n');
}

async function main() {
    try {
        execSync('cd circuits/payroll && nargo compile', { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ Circuit compilation failed');
        process.exit(1);
    }
    
    const result = extractCommitmentsFromTest();
    
    if (!result || result.xlmCommits.length < 3) {
        console.error('❌ Failed to extract commitments');
        process.exit(1);
    }
    
    const { xlmCommits, usdcCommits } = result;
    
    // ─────────────────────────────────────────────────────────────────────────
    // Update Prover.toml (XLM)
    // ─────────────────────────────────────────────────────────────────────────
    const xlmProverPath = path.join(__dirname, '../circuits/payroll/Prover.toml');
    const xlmContent = `# ============================================================================
# Test Input for 3 employees paid in XLM
# ============================================================================

employee_ids = [1, 2, 3, 0, 0, 0, 0, 0, 0, 0]
salaries = [5000, 3000, 7000, 0, 0, 0, 0, 0, 0, 0]
salts = [12345, 67890, 11111, 0, 0, 0, 0, 0, 0, 0]
payee_types = [0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
token_type = 0

# 🔥 AUTO-GENERATED from nargo test
commitments = [
${formatCommitments(xlmCommits, 10)}
]

total_amount = 15000
employee_total = 8000
contractor_total = 7000
freelancer_total = 0
vendor_total = 0
consultant_total = 0
employee_count = 2
contractor_count = 1
freelancer_count = 0
vendor_count = 0
consultant_count = 0
token_type_public = 0
employee_count_total = 3
`;
    
    fs.writeFileSync(xlmProverPath, xlmContent);
    
    // ─────────────────────────────────────────────────────────────────────────
    // Update Prover.usdc.toml (USDC)
    // ─────────────────────────────────────────────────────────────────────────
    if (usdcCommits.length >= 2) {
        const usdcProverPath = path.join(__dirname, '../circuits/payroll/Prover.usdc.toml');
        const usdcContent = `# ============================================================================
# Test Input for 2 employees paid in USDC
# ============================================================================

employee_ids = [4, 5, 0, 0, 0, 0, 0, 0, 0, 0]
salaries = [10000, 15000, 0, 0, 0, 0, 0, 0, 0, 0]
salts = [99999, 88888, 0, 0, 0, 0, 0, 0, 0, 0]
payee_types = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
token_type = 1

# 🔥 AUTO-GENERATED from nargo test
commitments = [
${formatCommitments(usdcCommits, 10)}
]

total_amount = 25000
employee_total = 25000
contractor_total = 0
freelancer_total = 0
vendor_total = 0
consultant_total = 0
employee_count = 2
contractor_count = 0
freelancer_count = 0
vendor_count = 0
consultant_count = 0
token_type_public = 1
employee_count_total = 2
`;
        
        fs.writeFileSync(usdcProverPath, usdcContent);
    }
}

main().catch(console.error);