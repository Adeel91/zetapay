import fs from 'fs';
import path from 'path';
import { buildPoseidon } from 'circomlibjs';

const poseidon = await buildPoseidon();
const F = poseidon.F;

const inputPath = path.join(process.cwd(), 'circuits/payroll/inputs/xlm.json');
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

function poseidonHash(values) {
  return F.toString(poseidon(values.map((value) => BigInt(value))));
}

function merkleRoot8(leaves) {
  if (leaves.length !== 8) {
    throw new Error('merkleRoot8 expects exactly 8 leaves');
  }

  const level1 = [
    poseidonHash([leaves[0], leaves[1]]),
    poseidonHash([leaves[2], leaves[3]]),
    poseidonHash([leaves[4], leaves[5]]),
    poseidonHash([leaves[6], leaves[7]]),
  ];

  const level2 = [poseidonHash([level1[0], level1[1]]), poseidonHash([level1[2], level1[3]])];

  return poseidonHash([level2[0], level2[1]]);
}

const commitments = [];

for (let i = 0; i < data.payee_ids.length; i++) {
  if (data.amounts[i] === 0) {
    commitments.push('0');
    continue;
  }

  commitments.push(
    poseidonHash([
      data.payee_ids[i],
      data.recipient_hashes[i],
      data.amounts[i],
      data.payee_types[i],
      data.token_types[i],
      data.period_id,
      data.salts[i],
    ])
  );
}

data.commitments = commitments;
data.batch_root_public = merkleRoot8(commitments);

fs.writeFileSync(inputPath, JSON.stringify(data, null, 2));

console.log('');
console.log('Generated commitments:', commitments.length);
console.log('Batch root:', data.batch_root_public);
console.log('Input file:', inputPath);
console.log('');
