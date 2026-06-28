# ZetaPay

ZetaPay is a private payroll and audit system built on Stellar Soroban using real Groth16 proofs over BN254.

The goal is to let an employer submit payroll batches for employees, contractors, freelancers, vendors, consultants, and contributors while allowing auditors to verify payroll totals without seeing every private salary detail.

## Current status

This branch rebuilt the zero knowledge payroll system from scratch.

Current working pieces:

1. Circom payroll circuit
2. Poseidon payroll commitments
3. Mixed XLM and USDC inside one payroll batch
4. Groth16 proof generation with snarkjs
5. Local proof verification with snarkjs
6. Rust fixture export from proof artifacts
7. Soroban BN254 Groth16 verifier contract
8. Soroban payroll contract
9. Payroll batch submission
10. Payroll batch execution
11. Replay protection
12. Total verification against proof public inputs
13. Payroll run summary tracking
14. Real integration tests with no mock verifier

## Why this branch exists

The old version used Noir and Barretenberg proof artifacts, but the Soroban verifier was written for Groth16 over BN254. Those proof systems are not compatible.

This branch uses a consistent stack from end to end:

1. Circom circuit
2. snarkjs Groth16 proof
3. BN254 verification key
4. Soroban BN254 verifier
5. Payroll contract calling the verifier

## Main architecture

The system has three intended personas:

1. Employer

Creates payroll runs, submits proof batches, and executes payments.

2. Auditor

Checks payroll summaries, batch status, execution status, and totals.

3. Payee

Not implemented in the UI yet, but planned. A payee should later be able to prove inclusion in a payroll batch without seeing other people salary data.

## Payroll model

A payroll run can contain many batches.

Example:

```text
Payroll run A
  batch 0
  batch 1
  batch 2
  batch 3
```

This matters because Groth16 circuits have fixed size. Instead of creating one massive proof for thousands of people, the payroll is split into many fixed size batches.

For production, the intended batch size is 128 payees per proof.

For development, the circuit currently uses a smaller batch size so compilation and tests are fast.

## Supported payee types

The circuit and contract support these payee categories:

```text
0 = Employee
1 = Contractor
2 = Freelancer
3 = Vendor
4 = Consultant
5 = Contributor
```

## Supported tokens

Each payee has their own token type.

```text
0 = XLM
1 = USDC
```

This means one payroll batch can include both XLM and USDC payments.

Example:

```text
Employee 1 receives XLM
Employee 2 receives USDC
Freelancer 1 receives USDC
Vendor 1 receives XLM
```

## Payroll commitment

Each payee is committed with Poseidon:

```text
Poseidon(
  payee_id,
  recipient_hash,
  amount,
  payee_type,
  token_type,
  period_id,
  salt
)
```

Meaning:

1. `payee_id` comes from the database
2. `recipient_hash` represents the recipient wallet hash
3. `amount` is the payment amount
4. `payee_type` identifies employee, contractor, freelancer, vendor, consultant, or contributor
5. `token_type` identifies XLM or USDC
6. `period_id` identifies the payroll period
7. `salt` hides the commitment from brute force guessing

## Current circuit public inputs

The current circuit exposes:

```text
commitments
total_amount
total_xlm
total_usdc
employee_total
contractor_total
freelancer_total
vendor_total
consultant_total
contributor_total
employee_count
contractor_count
freelancer_count
vendor_count
consultant_count
contributor_count
period_id_public
payroll_run_hash_public
batch_index_public
batch_count_public
payee_count_total
```

The contract parses these public inputs and compares them against submitted payment data.

This prevents the frontend from submitting payment data that does not match the proof.

## Current contract flow

### initialize

Stores:

```text
employer
verifier contract address
XLM token contract
USDC token contract
verification key
batch counter
```

Only the employer can initialize.

### submit_batch

The employer submits:

```text
payments
proof
public inputs
payroll run hash
payroll run hash field
period id
batch index
batch count
commitment root
```

The contract:

1. Requires employer authorization
2. Rejects empty payment batches
3. Computes a proof hash
4. Rejects duplicate proofs
5. Calls the real `zk-verifier` contract
6. Rejects invalid proofs
7. Parses totals from public inputs
8. Checks payment count
9. Checks payment totals against proof totals
10. Checks period id, payroll run hash field, batch index, and batch count
11. Stores the payroll record
12. Marks the proof as processed
13. Updates payroll run summary

### execute_batch

The employer executes an already submitted batch.

The contract:

1. Requires employer authorization
2. Loads the payroll record
3. Rejects already executed batches
4. Transfers XLM and USDC to recipients
5. Marks the batch as executed
6. Updates payroll run summary

## Payroll run summary

The payroll contract tracks a summary per payroll run:

```text
payroll_run_hash
period_id
batch_count
submitted_batches
executed_batches
total_amount
total_xlm
total_usdc
is_complete
is_fully_executed
```

This is the main auditor friendly view.

## Contracts

The contracts workspace currently contains:

```text
contracts
  Cargo.toml
  zk-verifier
    Cargo.toml
    src
      lib.rs
      fixtures.rs
      test.rs
  zk-payroll
    Cargo.toml
    src
      lib.rs
      contract.rs
      error.rs
      storage.rs
      types.rs
      fixtures.rs
      test.rs
```

## zk verifier contract

The verifier contract is a real Groth16 verifier over BN254 using Soroban native crypto APIs.

It exposes:

```rust
verify(vk, proof, public_inputs) -> Result<bool, VerifierError>
```

It checks:

1. Verification key length
2. Public input count
3. Groth16 pairing equation

The verifier test uses real proof fixtures exported from snarkjs.

## zk payroll contract

The payroll contract calls `zk-verifier`.

It is responsible for:

1. Employer authorization
2. Proof replay prevention
3. Proof verification
4. Totals validation
5. Payroll record storage
6. Payroll run summary tracking
7. XLM and USDC transfer execution

## Current tests

### zk verifier

Command:

```bash
yarn contracts:zk-verifier:test
```

Current test:

```text
verifies_real_groth16_payroll_proof
```

This verifies the real Groth16 proof generated from the Circom circuit.

### zk payroll

Command:

```bash
yarn contracts:zk-payroll:test
```

Current tested behavior:

```text
submit batch verifies real Groth16 proof and stores record
execute batch transfers XLM and USDC once
submit batch rejects duplicate proof
submit batch rejects payment totals that do not match proof
execute batch rejects unknown batch
payroll run summary tracks submission and execution
```

## Installed packages

Removed old Noir packages:

```bash
yarn remove @noir-lang/backend_barretenberg @noir-lang/noir_js @noir-lang/noirc_abi
```

Installed Groth16 and Circom tooling:

```bash
yarn add snarkjs circomlibjs circomlib
yarn add -D circom_tester
```

Installed Circom compiler from source:

```bash
cd /tmp
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
```

Confirmed with:

```bash
circom --version
```

Working version used:

```text
circom compiler 2.2.3
```

The temporary source folder can be removed after install:

```bash
rm -rf /tmp/circom
```

## Important package scripts

### Circuit scripts

```json
"circuits:clean": "rm -rf circuits/payroll/build/*",
"circuits:compile": "circom circuits/payroll/circuits/payroll.circom --r1cs --wasm --sym -l node_modules -o circuits/payroll/build",
"circuits:inputs": "node circuits/payroll/scripts/generate-inputs.js",
"circuits:witness": "node circuits/payroll/build/payroll_js/generate_witness.js circuits/payroll/build/payroll_js/payroll.wasm circuits/payroll/inputs/xlm.json circuits/payroll/build/witness.wtns",
"circuits:ptau": "mkdir -p circuits/payroll/ptau && test -f circuits/payroll/ptau/powersOfTau28_hez_final_15.ptau || curl -L -o circuits/payroll/ptau/powersOfTau28_hez_final_15.ptau https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_15.ptau",
"circuits:setup": "yarn circuits:ptau && npx snarkjs groth16 setup circuits/payroll/build/payroll.r1cs circuits/payroll/ptau/powersOfTau28_hez_final_15.ptau circuits/payroll/build/payroll_0000.zkey && npx snarkjs zkey contribute circuits/payroll/build/payroll_0000.zkey circuits/payroll/build/payroll_final.zkey --name='ZetaPay local contribution' -v -e='zetapay payroll groth16 local entropy' && npx snarkjs zkey export verificationkey circuits/payroll/build/payroll_final.zkey circuits/payroll/build/verification_key.json",
"circuits:prove": "npx snarkjs groth16 prove circuits/payroll/build/payroll_final.zkey circuits/payroll/build/witness.wtns circuits/payroll/build/proof.json circuits/payroll/build/public.json",
"circuits:verify": "npx snarkjs groth16 verify circuits/payroll/build/verification_key.json circuits/payroll/build/public.json circuits/payroll/build/proof.json",
"circuits:fixtures": "node circuits/payroll/scripts/export-fixtures.js",
"circuits:all": "yarn circuits:inputs && yarn circuits:witness && yarn circuits:prove && yarn circuits:verify && yarn circuits:fixtures",
"circuits:rebuild": "yarn circuits:clean && yarn circuits:compile && yarn circuits:setup && yarn circuits:all"
```

### Contract scripts

```json
"contracts:clean": "cd contracts && cargo clean",
"contracts:zk-verifier:test": "cd contracts && cargo test -p zk-verifier -- --nocapture",
"contracts:zk-payroll:test": "cd contracts && cargo test -p zk-payroll -- --nocapture",
"contracts:zk-payroll:check": "cd contracts && cargo check -p zk-payroll"
```

## Common workflows

### When the circuit changes

Run:

```bash
yarn circuits:rebuild
```

This performs:

1. Clean build artifacts
2. Compile circuit
3. Download ptau if missing
4. Run Groth16 setup
5. Export verification key
6. Generate inputs
7. Generate witness
8. Generate proof
9. Verify proof
10. Export Rust fixtures

### When only payroll input data changes

Run:

```bash
yarn circuits:all
```

This performs:

1. Generate commitments
2. Generate witness
3. Generate proof
4. Verify proof
5. Export Rust fixtures

### Run verifier tests

```bash
yarn contracts:zk-verifier:test
```

### Run payroll tests

```bash
yarn contracts:zk-payroll:test
```

### Check payroll contract

```bash
yarn contracts:zk-payroll:check
```

## Circuit files

Current circuit location:

```text
circuits/payroll/circuits/payroll.circom
```

Current input fixture:

```text
circuits/payroll/inputs/xlm.json
```

Current scripts:

```text
circuits/payroll/scripts/generate-inputs.js
circuits/payroll/scripts/export-fixtures.js
```

Generated artifacts:

```text
circuits/payroll/build/payroll.r1cs
circuits/payroll/build/payroll.sym
circuits/payroll/build/payroll_js/payroll.wasm
circuits/payroll/build/witness.wtns
circuits/payroll/build/payroll_0000.zkey
circuits/payroll/build/payroll_final.zkey
circuits/payroll/build/verification_key.json
circuits/payroll/build/proof.json
circuits/payroll/build/public.json
```

The ptau file is stored at:

```text
circuits/payroll/ptau/powersOfTau28_hez_final_15.ptau
```

## Fixture export

The fixture export script reads:

```text
proof.json
public.json
verification_key.json
```

and generates:

```text
contracts/zk-verifier/src/fixtures.rs
contracts/zk-payroll/src/fixtures.rs
```

The verifier fixtures contain:

```text
PROOF_A
PROOF_B
PROOF_C
SIGNALS
VK_ALPHA
VK_BETA
VK_GAMMA
VK_DELTA
VK_IC
```

The payroll fixtures contain:

```text
REAL_PROOF_A
REAL_PROOF_B
REAL_PROOF_C
REAL_SIGNALS
REAL_VK_ALPHA
REAL_VK_BETA
REAL_VK_GAMMA
REAL_VK_DELTA
REAL_VK_IC
```

## Current proof status

The current proof verifies locally with:

```bash
yarn circuits:verify
```

Expected output:

```text
snarkJS: OK!
```

The same proof verifies inside Soroban through:

```bash
yarn contracts:zk-verifier:test
```

and through the payroll contract with:

```bash
yarn contracts:zk-payroll:test
```

## Design decisions already made

### No Noir in the proof path

Noir and Barretenberg were removed because the Soroban verifier expects Groth16 BN254 artifacts.

### One payroll run can have many batches

This lets the system scale to thousands of payees.

### One batch can contain mixed XLM and USDC

Each payee has their own `token_type`.

### Frontend is not trusted for totals

The contract parses totals from proof public inputs and compares them against the submitted payments.

### Submit and execute are separate

`submit_batch` verifies and stores payroll data.

`execute_batch` transfers tokens.

This improves safety, retry behavior, and auditability.

### Replay protection is required

The contract stores processed proof hashes and rejects duplicate proof submissions.

### Payroll run summary is required

Auditors need to see the status of a full payroll run, not just isolated batches.

## Planned architectural improvements

### Batch Merkle root

Current state:

```text
commitment_root is passed to the contract
```

Planned state:

```text
circuit computes batch_root from commitments
batch_root is a public input
contract checks commitment_root against proof public input
```

This prevents the frontend from lying about the root.

### Employee or freelancer claim verification

A payee should later be able to prove:

```text
I was included in payroll run X
I was paid amount Y
I was paid in token Z
My wallet was the intended recipient
```

without seeing anyone else's payroll.

This can begin as an off chain helper using:

```text
commitment
Merkle proof
batch root
```

### Auditor API

Planned getters:

```text
get_payroll_run_summary
get_payroll_record
get_batch_count
get_batch_ids_for_run
```

### Database driven proof generation

The current `xlm.json` file is a development fixture.

Production flow should be:

```text
Supabase and Drizzle
  payees
  payroll_runs
  payroll_items
      ↓
generate circuit input
      ↓
generate witness
      ↓
generate proof
      ↓
submit batch
```

### Events

Events are postponed for now.

They will become useful later for:

```text
dashboard updates
auditor notifications
indexing payroll history
showing completed payrolls without scanning storage
```

## Next recommended step

The next protocol improvement should be Batch Merkle Root.

Recommended plan:

1. Change dev circuit size from 10 to 8 because 8 is a power of two
2. Later production size becomes 128
3. Add Poseidon Merkle tree inside the circuit
4. Compute `batch_root_public`
5. Add `batch_root_public` to public inputs
6. Update `generate-inputs.js`
7. Update `export-fixtures.js`
8. Update `contract.rs` to compare `commitment_root` with proof public input
9. Regenerate proof
10. Run verifier and payroll tests

## Current milestone summary

The project currently has a real end to end private payroll proof flow:

```text
Circom circuit
  ↓
Groth16 proof
  ↓
snarkjs verification
  ↓
Rust fixture export
  ↓
Soroban BN254 verifier
  ↓
ZkPayroll submit batch
  ↓
ZkPayroll execute batch
  ↓
XLM and USDC transfers
  ↓
Auditor friendly payroll run summary
```

All current core tests are passing.
