import fs from "fs";
import path from "path";
import { buildPoseidon } from "circomlibjs";

const poseidon = await buildPoseidon();
const F = poseidon.F;

const inputPath = path.join(process.cwd(), "circuits/payroll/inputs/xlm.json");
const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const commitments = [];

for (let i = 0; i < data.payee_ids.length; i++) {
    if (data.amounts[i] === 0) {
        commitments.push("0");
        continue;
    }

    const hash = poseidon([
        BigInt(data.payee_ids[i]),
        BigInt(data.recipient_hashes[i]),
        BigInt(data.amounts[i]),
        BigInt(data.payee_types[i]),
        BigInt(data.token_types[i]),
        BigInt(data.period_id),
        BigInt(data.salts[i])
    ]);

    commitments.push(F.toString(hash));
}

data.commitments = commitments;

fs.writeFileSync(inputPath, JSON.stringify(data, null, 2));

console.log("");
console.log("Generated commitments:", commitments.length);
console.log("Input file:", inputPath);
console.log("");