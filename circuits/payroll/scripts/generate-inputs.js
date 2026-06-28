import fs from 'fs';
import path from 'path';
import { buildPoseidon } from 'circomlibjs';

const BATCH_SIZE = 128;

const poseidon = await buildPoseidon();
const F = poseidon.F;

const inputPath = path.join(process.cwd(), 'circuits/payroll/inputs/xlm.json');
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

function padArray(values, padValue = 0) {
  if (values.length > BATCH_SIZE) {
    throw new Error(`Batch has ${values.length} payees, but max is ${BATCH_SIZE}`);
  }

  return [...values, ...Array.from({ length: BATCH_SIZE - values.length }, () => padValue)];
}

function poseidonHash(values) {
  return F.toString(poseidon(values.map((value) => BigInt(value))));
}

function merkleRoot(leaves) {
  if (leaves.length !== BATCH_SIZE) {
    throw new Error(`Merkle tree expects exactly ${BATCH_SIZE} leaves`);
  }

  let level = leaves.map((leaf) => leaf.toString());

  while (level.length > 1) {
    const next = [];

    for (let i = 0; i < level.length; i += 2) {
      next.push(poseidonHash([level[i], level[i + 1]]));
    }

    level = next;
  }

  return level[0];
}

data.payee_ids = padArray(data.payee_ids);
data.recipient_hashes = padArray(data.recipient_hashes);
data.amounts = padArray(data.amounts);
data.salts = padArray(data.salts);
data.payee_types = padArray(data.payee_types);
data.token_types = padArray(data.token_types);

const commitments = [];

for (let i = 0; i < BATCH_SIZE; i++) {
  if (Number(data.amounts[i]) === 0) {
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
data.batch_root_public = merkleRoot(commitments);

fs.writeFileSync(inputPath, JSON.stringify(data, null, 2));

console.log('');
console.log('Generated commitments:', commitments.length);
console.log('Active payees:', data.payee_count_total);
console.log('Batch size:', BATCH_SIZE);
console.log('Batch root:', data.batch_root_public);
console.log('Input file:', inputPath);
console.log('');
