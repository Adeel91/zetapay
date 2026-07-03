<p align="center">
  <img src="public/logo.svg" width="140" alt="ZetaPay Logo" />
</p>

<h1 align="center">ZetaPay</h1>

<p align="center">
  <strong>Enterprise Confidential & Shielded Payroll on Stellar</strong>
</p>

<p align="center">
  Batch Payroll • Confidential Settlement • Shielded Pool Payroll • Zero Knowledge Proofs
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stellar-Network-000000?style=for-the-badge&logo=stellar" alt="Stellar" />
  <img src="https://img.shields.io/badge/Soroban-Smart%20Contracts-08B5E5?style=for-the-badge" alt="Soroban" />
  <img src="https://img.shields.io/badge/Groth16-zkSNARKs-16a34a?style=for-the-badge" alt="Groth16" />
  <img src="https://img.shields.io/badge/BN254-Elliptic%20Curve-15803d?style=for-the-badge" alt="BN254" />
  <img src="https://img.shields.io/badge/Poseidon-ZK%20Hashing-059669?style=for-the-badge" alt="Poseidon" />
  <img src="https://img.shields.io/badge/Next.js-Framework-black?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Language-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Rust-Soroban-DEA584?style=for-the-badge&logo=rust" alt="Rust" />
  <img src="https://img.shields.io/badge/Circom-2.0-1E2A4A?style=for-the-badge" alt="Circom" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
</p>

> Built for the **Stellar Community Fund Hackathon**: an experimental testnet implementation of private enterprise payroll on Stellar, using Soroban contracts, Groth16 proofs, confidential payroll batches, and shielded pool withdrawals.

---

## 🎯 Why This Project Exists

**ZetaPay was built to solve a critical problem: enterprises need private, auditable payroll before they can use blockchain settlement for sensitive compensation workflows.**

Today, payroll is one of the most sensitive financial operations an organization runs. Salary data can reveal compensation structures, headcount changes, departmental budgets, contractor relationships, vendor activity, and operational timing. Traditional public blockchain payroll can expose transaction amounts, recipient wallets, payment timing, and payment relationships on the public ledger.

**ZetaPay fixes this by:**

- **Protecting salary data**: payroll records are represented through encrypted data, commitments, Merkle roots, and proof metadata instead of exposing raw payroll details publicly.
- **Protecting recipient linkage**: payroll note ownership is not publicly linked to the employer funded batch.
- **Reducing timing correlation**: shielded pool recipients can withdraw later from shared pool liquidity.
- **Limiting public disclosure**: public verification shows proof status, batch roots, commitment counts, and metadata instead of salaries or identities.

**Who benefits:**

- **🏢 Enterprises**: pay employees privately while maintaining full auditability.
- **👤 Employees**: receive salaries without exposing their personal wallet activity.
- **📋 Auditors**: verify payroll compliance without accessing sensitive employee data.
- **🌐 The Stellar Ecosystem**: unlocks enterprise payroll as a real‑world use case for Soroban.

ZetaPay makes blockchain payroll viable for any organization that values privacy, compliance, and operational security.

---

## 🚀 What It Is

**ZetaPay** is an enterprise payroll platform that distributes salaries privately on Stellar using **zero‑knowledge cryptography**. Instead of exposing every employee payment on the public ledger, payroll is processed as a **single batch settlement** (up to 128 recipients) using **XLM** or **USDC**. The system offers two modes:

- **🔒 Confidential Payroll**: encrypted direct transfer payroll for known recipients. The employer funds a payroll batch and the contract settles XLM or USDC directly to approved employees, contractors, freelancers, consultants, vendors, or contributors while keeping payroll records private through commitments, encrypted metadata, and scoped verification.
- **🛡 Shielded Pool Payroll**: pool based private payroll where the employer funds shielded notes into a shared pool. Recipients withdraw later using zero knowledge proofs, accepted Merkle roots, and nullifier hashes, reducing visible linkage between the employer funded batch and the recipient withdrawal.

The platform is built on **Soroban smart contracts**, **Groth16 zkSNARKs** over **BN254**, **Poseidon hashing**, **Merkle trees**, **commitments**, and **nullifiers**. The application layer uses **Next.js 16 App Router**, **React 19**, **TypeScript**, **Tailwind CSS**, **PostgreSQL** through **Drizzle ORM**, **Supabase integration**, and cookie based session handling.

---

## ✨ Key Features

| 🏢 Enterprise Ready                   | 🔐 Privacy First      | 🧠 Zero‑Knowledge           | 📊 Developer Experience      |
| ------------------------------------- | --------------------- | --------------------------- | ---------------------------- |
| Batch payroll (up to 128 recipients)  | Confidential payroll  | Groth16 zkSNARKs            | Next.js 16 App Router        |
| XLM & USDC support                    | Shielded pool payroll | Poseidon hashing            | TypeScript + Tailwind        |
| Employer / employee / auditor portals | Merkle commitments    | BN254 elliptic curve        | PostgreSQL + Drizzle         |
| Payroll history & audit reporting     | Nullifier protection  | On-chain proof verification | Supabase integration         |
| Audit keys & verification links       | Selective disclosure  | Circom circuits             | Developer automation scripts |

---

## 🌍 Why ZetaPay?

Traditional blockchain payroll reveals far more than enterprises should disclose:

| Traditional Payroll             | ZetaPay              |
| ------------------------------- | -------------------- |
| Individual transactions         | Batch settlement     |
| Visible recipient relationships | Hidden ownership     |
| Public payment timing           | Delayed withdrawals  |
| Wallet graph analysis           | Shared anonymity     |
| Salary correlation              | Private commitments  |
| Public history                  | Selective disclosure |

ZetaPay transforms payroll records into commitments, encrypted payloads, Merkle roots, nullifiers, and proof metadata. Public verification can confirm payroll validity without exposing salaries, recipient identities, or private payroll records.

---

## 🏗 System Architecture

```mermaid
graph TD
    subgraph Frontend["Frontend – Next.js 16 + React + TypeScript + Tailwind"]
        LANDING["Landing & Marketing<br/>/ (marketing)"]
        EMP["Employer Portal<br/>/employer/*"]
        REC["Recipient Portal<br/>/employee/*"]
        AUD["Auditor Portal<br/>/audit/*"]
        AUTH["Authentication<br/>/auth/*<br/>Supabase + cookie sessions"]
    end

    subgraph Backend["Backend – Next.js API Routes"]
        API["/api/*<br/>payroll, employees, reports, stellar"]
        ORCH["Payroll Orchestrator<br/>batch creation, commitment generation"]
        PROV["Off‑chain Prover<br/>snarkjs + circomlib"]
    end

    subgraph DB["Database – PostgreSQL + Drizzle"]
        SCHEMA["schema.ts<br/>enterprises, employees, payrolls, audit logs"]
        MIGRATIONS["migrations/<br/>0000_woozy_hulk.sql"]
    end

    subgraph ZK["Zero‑Knowledge Layer – Circom / Groth16"]
        PAYROLL_CIRCUIT["payroll.circom<br/>batch commitment proof"]
        DEPOSIT_CIRCUIT["deposit.circom<br/>shielded deposit proof"]
        WITHDRAW_CIRCUIT["withdraw.circom<br/>shielded withdrawal proof"]
    end

    subgraph Contracts["Soroban Smart Contracts – Rust"]
        VERIFIER["zetapay-verifier<br/>BN254 pairing check"]
        PAYROLL_CONTRACT["zetapay-payroll<br/>submit, execute, root storage"]
        POOL_CONTRACT["zetapay-pool<br/>deposit, withdraw, nullifiers"]
    end

    subgraph Stellar["Stellar Blockchain"]
        LEDGER["Asset transfers (XLM / USDC)"]
    end

    EMP --> ORCH
    REC --> PROV
    AUD --> API
    API --> ORCH
    ORCH --> PROV
    ORCH --> DB
    PROV --> PAYROLL_CIRCUIT
    PROV --> DEPOSIT_CIRCUIT
    PROV --> WITHDRAW_CIRCUIT
    PAYROLL_CIRCUIT --> VERIFIER
    DEPOSIT_CIRCUIT --> VERIFIER
    WITHDRAW_CIRCUIT --> VERIFIER
    VERIFIER --> PAYROLL_CONTRACT
    VERIFIER --> POOL_CONTRACT
    PAYROLL_CONTRACT --> LEDGER
    POOL_CONTRACT --> LEDGER
```

---

## 📁 Project Structure

The repository is organized as follows (based on the actual source tree):

```
ZETAPAY/
├── .husky/                    # Git hooks for linting & formatting
├── circuits/                  # Zero‑knowledge circuits
│   ├── payroll/               # Payroll batch proof
│   │   ├── build/             # Compiled artifacts (.r1cs, .wasm, .zkey)
│   │   ├── circuits/          # Circom source files
│   │   │   └── payroll.circom # Main payroll circuit (128 payees)
│   │   ├── inputs/            # Test input JSONs (xlm.json, etc.)
│   │   ├── ptau/              # Powers of Tau (phase 1)
│   │   └── scripts/           # Helper scripts
│   │       ├── export-fixtures.js
│   │       ├── generate-inputs.js
│   │       └── merkle.js
│   └── pool/                  # Shielded pool proofs
│       ├── build/
│       ├── circuits/          # Circom source files
│       │   ├── deposit.circom # Deposit proof
│       │   └── withdraw.circom # Withdrawal proof
│       ├── inputs/            # Test input JSONs
│       │   ├── deposit.json
│       │   ├── note.json
│       │   ├── tree.json
│       │   └── withdraw.json
│       ├── ptau/
│       └── scripts/
│           ├── export-fixtures.js
│           ├── generate-deposit-inputs.js
│           └── generate-withdraw-inputs.js
├── contracts/                 # Soroban smart contracts (Rust)
│   ├── target/                # Compiled WASM
│   ├── zetapay-payroll/       # Payroll settlement contract
│   │   ├── src/
│   │   │   ├── contract.rs    # Main contract logic
│   │   │   ├── error.rs       # Error types
│   │   │   ├── fixtures.rs    # Test fixtures
│   │   │   ├── lib.rs         # Module exports
│   │   │   ├── storage.rs     # Storage management
│   │   │   ├── test.rs        # Unit tests
│   │   │   └── types.rs       # Type definitions
│   │   ├── test_snapshots/    # Test snapshots
│   │   └── Cargo.toml
│   ├── zetapay-pool/          # Shielded pool contract
│   │   ├── src/
│   │   │   ├── contract.rs
│   │   │   ├── error.rs
│   │   │   ├── fixtures.rs
│   │   │   ├── lib.rs
│   │   │   ├── storage.rs
│   │   │   ├── test.rs
│   │   │   └── types.rs
│   │   ├── test_snapshots/
│   │   └── Cargo.toml
│   ├── zetapay-verifier/      # Groth16 verifier contract
│   │   ├── src/
│   │   │   ├── fixtures.rs
│   │   │   ├── lib.rs         # BN254 verification
│   │   │   └── test.rs
│   │   ├── test_snapshots/
│   │   └── Cargo.toml
│   ├── Cargo.lock
│   └── Cargo.toml             # Workspace configuration
├── drizzle/                   # Database migrations (Drizzle ORM)
│   └── migrations/
│       ├── meta/              # Migration metadata
│       └── 0000_woozy_hulk.sql
├── public/                    # Static assets (logo, favicon, etc.)
├── scripts/                   # Deployment & initialization scripts
│   └── contracts/
│       ├── initialize-pool.ts # Init the shielded pool
│       └── initialize.ts      # Init the payroll contract
├── src/                       # Next.js application (App Router)
│   ├── app/                   # Next.js pages & API routes
│   │   ├── (marketing)/       # Landing page group
│   │   ├── api/               # REST API endpoints
│   │   ├── audit/             # Auditor portal routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── employee/          # Employee portal
│   │   ├── employer/          # Employer portal
│   │   ├── payments/          # Payment views
│   │   ├── payroll/           # Payroll management
│   │   ├── settings/          # User settings
│   │   ├── stellar/           # Stellar integration views
│   │   ├── verify/            # Proof verification page
│   │   ├── globals.css        # Tailwind entry
│   │   ├── layout.tsx         # Root layout
│   │   ├── not-found.tsx      # 404 page
│   │   ├── page.tsx           # Home page
│   │   └── providers.tsx      # React context providers
│   ├── components/            # Reusable React components
│   │   ├── auth/              # Login, registration
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── home/              # Landing components
│   │   ├── shared/            # Buttons, modals, cards
│   │   └── ui/                # Tailwind‑based UI primitives
│   ├── config/                # App configuration
│   │   ├── constants.ts
│   │   ├── database.ts
│   │   └── index.ts
│   ├── lib/                   # Core business logic & server code
│   │   ├── db/                # Database client & schema
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   ├── security/          # Auth, encryption, audit keys
│   │   │   └── tokenVault.ts
│   │   ├── stellar/           # Stellar SDK wrappers
│   │   │   ├── client.ts
│   │   │   ├── freighter.ts
│   │   │   ├── horizon.ts
│   │   │   └── server.ts
│   │   ├── supabase/          # Supabase client
│   │   │   ├── client.ts
│   │   │   ├── middleware.ts
│   │   │   └── server.ts
│   │   ├── zetapay/           # ZetaPay core logic
│   │   │   ├── contracts/     # Contract interaction helpers
│   │   │   └── proof/         # Proof generation & verification
│   │   └── zk/                # Zero‑knowledge utilities
│   │       ├── merkle.ts
│   │       ├── payee-verification.ts
│   │       ├── payroll-batch.ts
│   │       └── payroll-commitment.ts
│   └── middleware.ts          # Next.js middleware (auth, routing)
├── .env.example               # Environment variables template
├── .eslintrc.js               # ESLint config
├── .prettierrc                # Prettier config
├── drizzle.config.ts          # Drizzle configuration
├── next.config.ts             # Next.js config
├── package.json               # Dependencies & scripts (see below)
├── tsconfig.json              # TypeScript config
└── tailwind.config.ts         # Tailwind CSS config
```

---

## 🏛 Smart Contracts

ZetaPay consists of three Soroban smart contracts written in Rust (`no_std`), organized as a Cargo workspace under `contracts/`.

### Contract Structure

Each contract follows the same modular pattern:

```
contract-name/
├── src/
│   ├── contract.rs   # Main contract implementation
│   ├── error.rs      # Error types (contracterror)
│   ├── fixtures.rs   # Test fixtures
│   ├── lib.rs        # Module exports
│   ├── storage.rs    # Storage management (persistence)
│   ├── test.rs       # Unit tests
│   └── types.rs      # Type definitions (contracttype)
├── test_snapshots/   # Snapshot tests
└── Cargo.toml
```

### 1. `zetapay-verifier` - Groth16 Verifier

The verifier contract handles the on‑chain Groth16 proof verification using Soroban's BN254 host functions.

**Key Types:**

```rust
pub struct VerificationKey {
    pub alpha: Bn254G1Affine,
    pub beta: Bn254G2Affine,
    pub gamma: Bn254G2Affine,
    pub delta: Bn254G2Affine,
    pub ic: Vec<Bn254G1Affine>,
}

pub struct Proof {
    pub a: Bn254G1Affine,
    pub b: Bn254G2Affine,
    pub c: Bn254G1Affine,
}
```

**Core Function:**

```rust
pub fn verify(
    env: Env,
    vk: VerificationKey,
    proof: Proof,
    public_inputs: Vec<Bn254Fr>,
) -> Result<bool, VerifierError>
```

**How it works:**

1. Validates that the verification key has the correct number of public inputs.
2. Computes `vk_x = IC0 + Σ(ICi * public_input_i)` using G1 multiplications and additions.
3. Constructs the pairing check: `e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1`.
4. Returns `true` if the proof is valid.

### 2. `zetapay-payroll` - Confidential Payroll Settlement

The payroll contract manages confidential batch payroll submissions, proof verification, encrypted payroll metadata, and direct XLM or USDC settlement to known recipients.

**Key Functions:**

| Function                                                                           | Description                                                                                                                                    |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize(employer, verifier, xlm_token, usdc_token, vk)`                        | Initializes a new employer with verification key and token addresses.                                                                          |
| `submit_batch(payments, proof, public_inputs, encrypted_payroll, encrypted_notes)` | Submits a payroll batch with a ZK proof. Stores commitments and encrypted payroll data.                                                        |
| `execute_batch(batch_id, payments)`                                                | Executes a confidential payroll batch by verifying payment totals against the proof and transferring XLM or USDC directly to known recipients. |
| `submit_and_execute_batch(...)`                                                    | Submits and executes in a single transaction.                                                                                                  |
| `get_batch_count(employer)`                                                        | Returns the number of batches submitted.                                                                                                       |
| `get_payroll_record(employer, batch_id)`                                           | Retrieves a payroll record by ID.                                                                                                              |

**Confidential Payroll Flow:**

1. Employer creates a payroll batch for known recipients.
2. Backend generates encrypted payroll records, commitments, public inputs, and a Groth16 proof.
3. Employer submits the batch, proof, public inputs, encrypted payroll data, and encrypted notes.
4. Contract verifies the proof using the `zetapay-verifier`.
5. Contract stores the batch root, encrypted metadata, and payroll record.
6. When executed, the contract verifies that payment totals match the proof.
7. Contract transfers XLM or USDC directly to each approved recipient in the batch.
8. Contract marks the batch as executed.

**Public Inputs (21 signals):**

```
batch_root, total_amount, total_xlm, total_usdc,
employee_total, contractor_total, freelancer_total, vendor_total, consultant_total, contributor_total,
employee_count, contractor_count, freelancer_count, vendor_count, consultant_count, contributor_count,
period_id, payroll_run_hash, batch_index, batch_count, payee_count_total
```

### 3. `zetapay-pool` - Shielded Pool

The pool contract manages shielded payroll deposits, accepted Merkle roots, note commitments, nullifier hashes, and private withdrawals from the shared pool.

**Key Functions:**

| Function                                                                                                | Description                                                                                                    |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `initialize(admin, verifier, vk)`                                                                       | Initializes the pool with admin address and verification key.                                                  |
| `register_token(admin, token)`                                                                          | Registers a token (XLM or USDC) for use in the pool.                                                           |
| `post_root(admin, root)`                                                                                | Accepts a new Merkle root (submitted by the coordinator).                                                      |
| `deposit_note(depositor, token, amount, commitment)`                                                    | Deposits funds and stores a shielded note commitment.                                                          |
| `deposit_notes(depositor, deposits)`                                                                    | Batch deposit multiple notes.                                                                                  |
| `fund_payroll(admin, root, deposits)`                                                                   | Funds shielded payroll by depositing multiple private notes into the shared pool and accepting the batch root. |
| `withdraw_with_proof(recipient, token, amount, commitment, root, nullifier_hash, proof, public_inputs)` | Withdraws funds using a ZK proof. Checks nullifier is unspent, verifies proof, transfers funds.                |
| `get_note(commitment)`                                                                                  | Retrieves a shielded note by commitment.                                                                       |
| `is_nullifier_spent(nullifier_hash)`                                                                    | Checks if a nullifier has been spent.                                                                          |
| `get_stats()`                                                                                           | Returns pool statistics (deposit count, withdrawal count).                                                     |

**Shielded Payroll Deposit Flow:**

1. Employer creates shielded notes for payroll recipients.
2. Employer funds the shielded pool using XLM or USDC.
3. Contract receives the pool deposits and stores note commitments.
4. Backend or coordinator builds the Merkle tree for the deposited notes.
5. Contract accepts the resulting Merkle root for future withdrawal proofs.

**Shielded Withdrawal Flow:**

1. Recipient receives or reconstructs their private shielded note.
2. Recipient generates a Groth16 withdrawal proof off chain.
3. Recipient calls `withdraw_with_proof` with the proof, root, nullifier hash, token, amount, recipient address, and public inputs.
4. Contract verifies:
   - token is registered
   - Merkle root is accepted
   - nullifier hash has not been spent
   - note commitment is valid for the accepted root
   - amount and token match the withdrawal claim
   - proof is valid through the `zetapay-verifier`
5. Contract stores the nullifier hash as spent.
6. Contract transfers XLM or USDC from the shielded pool to the recipient.

---

## 🔐 Zero‑Knowledge Circuits

The circuits are built with **Circom** and compiled to **Groth16** over **BN254**. Hashing uses **Poseidon** for ZK friendly commitments, Merkle roots, and nullifier related values.

### Circuit Structure

```
circuits/
├── payroll/
│   └── circuits/
│       └── payroll.circom   # Main payroll circuit (128 payees)
├── pool/
│   └── circuits/
│       ├── deposit.circom   # Deposit proof
│       └── withdraw.circom  # Withdrawal proof
└── (shared utilities)
```

### 1. `payroll.circom` - Payroll Batch Proof

**Purpose:** Prove that a batch of up to 128 payroll payments is valid, funded, and corresponds to a Merkle root.

**Template: `PayrollBatch(maxPayees)`**

**Private Inputs:**

| Input                   | Description                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `payee_ids[128]`        | Unique payee identifiers                                                                  |
| `recipient_hashes[128]` | Poseidon hash of recipient wallet address                                                 |
| `amounts[128]`          | Salary amounts (Stellar atomic units)                                                     |
| `salts[128]`            | Random salts for each commitment                                                          |
| `payee_types[128]`      | Payee type: 0=Employee, 1=Contractor, 2=Freelancer, 3=Vendor, 4=Consultant, 5=Contributor |
| `token_types[128]`      | Token type: 0=XLM, 1=USDC                                                                 |
| `period_id`             | Payroll period identifier                                                                 |
| `payroll_run_hash`      | Unique hash for the payroll run                                                           |
| `batch_index`           | Index of this batch in the run                                                            |
| `batch_count`           | Total number of batches                                                                   |

**Public Outputs (21 signals):**

| Output                    | Description                                |
| ------------------------- | ------------------------------------------ |
| `batch_root_public`       | Merkle root of all commitments             |
| `total_amount`            | Total payroll amount (sum of all salaries) |
| `total_xlm`               | Total XLM amount                           |
| `total_usdc`              | Total USDC amount                          |
| `employee_total`          | Total paid to employees                    |
| `contractor_total`        | Total paid to contractors                  |
| `freelancer_total`        | Total paid to freelancers                  |
| `vendor_total`            | Total paid to vendors                      |
| `consultant_total`        | Total paid to consultants                  |
| `contributor_total`       | Total paid to contributors                 |
| `employee_count`          | Number of employees paid                   |
| `contractor_count`        | Number of contractors paid                 |
| `freelancer_count`        | Number of freelancers paid                 |
| `vendor_count`            | Number of vendors paid                     |
| `consultant_count`        | Number of consultants paid                 |
| `contributor_count`       | Number of contributors paid                |
| `period_id_public`        | Payroll period ID                          |
| `payroll_run_hash_public` | Payroll run hash                           |
| `batch_index_public`      | Batch index                                |
| `batch_count_public`      | Total batches                              |
| `payee_count_total`       | Total number of payees                     |

**How it works:**

1. For each payee, computes `commitment = Poseidon(payee_id, recipient_hash, amount, payee_type, token_type, period_id, salt)`.
2. Builds a Merkle tree (depth 7, capacity 128 leaves) from all commitments.
3. Aggregates totals by payee type and token type.
4. Enforces: `payee_type` is valid (0‑5), `token_type` is valid (0‑1).
5. Outputs the Merkle root and all public totals.

### 2. `deposit.circom` - Shielded Deposit Proof

**Purpose:** Prove that a shielded deposit is valid and generates a correct commitment.

**Template: `DepositNote()`**

**Private Inputs:**

| Input        | Description                        |
| ------------ | ---------------------------------- |
| `secret`     | Depositor's secret                 |
| `nullifier`  | One‑time nullifier for the deposit |
| `amount`     | Deposit amount                     |
| `token_type` | Token type (0=XLM, 1=USDC)         |
| `salt`       | Random salt                        |

**Public Output:**

| Output              | Description                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| `commitment_public` | The commitment = Poseidon(secret, nullifier, amount, token_type, salt) |

**How it works:**

1. Computes `commitment = Poseidon(secret, nullifier, amount, token_type, salt)`.
2. Asserts that `commitment == commitment_public`.

### 3. `withdraw.circom` - Shielded Withdrawal Proof

**Purpose:** Prove that a recipient can withdraw a specific amount without revealing which deposit they are using.

**Template: `WithdrawNote(depth)` (depth=7 for Merkle tree)**

**Private Inputs:**

| Input                  | Description                        |
| ---------------------- | ---------------------------------- |
| `secret`               | Recipient's secret                 |
| `nullifier`            | One‑time nullifier                 |
| `amount_private`       | Amount being withdrawn             |
| `token_hash_private`   | Poseidon hash of the token address |
| `salt`                 | Random salt (must match deposit)   |
| `path_elements[depth]` | Merkle sibling hashes              |
| `path_indices[depth]`  | Merkle path indices (0/1)          |

**Public Outputs:**

| Output                   | Description                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `root_public`            | Current Merkle root (must match on‑chain)                                                   |
| `nullifier_hash_public`  | Hash of the nullifier (prevents double‑spend)                                               |
| `recipient_hash_public`  | Poseidon hash of recipient wallet address                                                   |
| `amount_public`          | Amount being withdrawn                                                                      |
| `token_hash_public`      | Poseidon hash of the token address                                                          |
| `withdrawal_hash_public` | Unique withdrawal identifier = Poseidon(nullifier_hash, recipient_hash, amount, token_hash) |

**How it works:**

1. Computes `commitment = Poseidon(secret, nullifier, amount_private, token_hash_private, salt)`.
2. Asserts `amount_private == amount_public` and `token_hash_private == token_hash_public`.
3. Computes `nullifier_hash = Poseidon(nullifier)` and asserts it matches `nullifier_hash_public`.
4. Computes `withdrawal_hash = Poseidon(nullifier_hash, recipient_hash, amount, token_hash)`.
5. Proves Merkle inclusion: walks the tree from the leaf (commitment) to the root using `path_elements` and `path_indices`.
6. Asserts the computed root matches `root_public`.

---

## 🌐 Environment Variables

Create a `.env` file in the project root. Use the exact variable names expected by the application and by the initialization scripts.

```env
# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (PostgreSQL via Drizzle)
DATABASE_URL=postgresql://user:password@localhost:5432/zetapay
DIRECT_URL=postgresql://user:password@localhost:5432/zetapay

# Security
TOKEN_ENCRYPTION_KEY=your_secure_encryption_key

# Stellar Network
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC=https://soroban-testnet.stellar.org

# Deployer Account
STELLAR_SOURCE_ACCOUNT=zetapay-deployer

# Contract IDs (set these after deployment)
ZETAPAY_VERIFIER_CONTRACT_ID=contract_id_here
ZETAPAY_PAYROLL_CONTRACT_ID=contract_id_here
ZETAPAY_POOL_CONTRACT_ID=contract_id_here

# Token Contracts
NEXT_PUBLIC_XLM_TOKEN_CONTRACT=stellar_xlm_contract_id
NEXT_PUBLIC_USDC_TOKEN_CONTRACT=stellar_usdc_contract_id
```

> **Important:** After deploying contracts with `yarn contracts:deploy`, copy the deployed verifier, payroll, and pool contract IDs from the console output and update the matching contract ID variables in your `.env` file before running initialization scripts.

---

## 📦 Key Scripts

The project includes scripts for development, database management, circuit proving, Soroban contract testing, testnet deployment, and contract initialization.

### Development & Database

| Script             | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `yarn dev`         | Starts the Next.js development server with Turbo mode.    |
| `yarn build`       | Builds the Next.js application.                           |
| `yarn start`       | Starts the production server.                             |
| `yarn lint`        | Runs ESLint with auto fix and formats code with Prettier. |
| `yarn type-check`  | Runs TypeScript checking without emitting files.          |
| `yarn db:generate` | Generates Drizzle ORM migrations.                         |
| `yarn db:migrate`  | Applies pending database migrations.                      |
| `yarn db:studio`   | Opens Drizzle Studio for database inspection.             |
| `yarn db:push`     | Pushes schema changes to the database.                    |

### Zero Knowledge Circuit Management

| Script                 | Description                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `yarn payroll:rebuild` | Cleans, compiles, sets up, proves, verifies, and exports payroll fixtures.                                   |
| `yarn payroll:all`     | Runs payroll input generation, witness generation, proof generation, proof verification, and fixture export. |
| `yarn pool:rebuild`    | Cleans and compiles shielded pool deposit and withdrawal circuits, then creates proving keys.                |
| `yarn pool:all`        | Runs shielded pool deposit and withdrawal proof generation, verification, and fixture export.                |

### Smart Contract Management

| Script                            | Description                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `yarn contracts:build`            | Builds all Soroban contracts using the Stellar CLI.                                 |
| `yarn contracts:test`             | Runs Rust unit tests for the verifier, payroll, and pool contracts.                 |
| `yarn contracts:deploy`           | Builds and deploys the verifier, payroll, and pool contracts to Stellar testnet.    |
| `yarn contracts:initialize`       | Initializes the confidential payroll contract after contract IDs are configured.    |
| `yarn contracts:initialize:pool`  | Initializes the shielded pool contract after contract IDs are configured.           |
| `yarn contracts:initialize:all`   | Initializes both the confidential payroll contract and the shielded pool contract.  |
| `yarn contracts:redeploy:testnet` | Runs the configured ZetaPay test script and redeploys contracts to Stellar testnet. |

### Full Testnet Pipeline

| Script                     | Description                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `yarn zetapay:test`        | Rebuilds payroll circuits, rebuilds pool circuits, runs pool proof workflows, and runs all contract tests.             |
| `yarn zetapay:full-deploy` | Runs linting, type checking, Rust linting, the full ZetaPay test workflow, and contract deployment to Stellar testnet. |

`yarn zetapay:full-deploy` deploys the verifier, payroll, and pool contracts, but it does not initialize them.

After deployment, copy the deployed contract IDs into `.env`, then run:

```bash
yarn contracts:initialize:all
```

---

## 🔧 Getting Started

### Prerequisites

- Node.js (v20+)
- Rust + Cargo (for Soroban contracts)
- Stellar CLI (`stellar` command) with a funded testnet account alias (e.g., `zetapay-deployer`)
- PostgreSQL (for the Next.js backend)
- Circom CLI and snarkjs are required when rebuilding circuits and regenerating proofs.

### Clone & Install

```bash
git clone https://github.com/Adeel91/zetapay.git
cd zetapay
yarn install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Run the Development Server

```bash
yarn dev
```

Visit `http://localhost:3000` - you'll see the landing page with employer, recipient, and auditor portals.

### Run the Full Test Suite

```bash
yarn zetapay:test
```

This rebuilds payroll and shielded pool circuits, runs pool proof workflows, and runs all contract unit tests.

### Deploy to Stellar Testnet

Run the full testnet deployment pipeline.

```bash
yarn zetapay:full-deploy
```

This command runs linting, type checking, Rust linting, payroll circuit rebuilds, shielded pool circuit rebuilds, proof workflows, contract tests, and Soroban contract deployment.

After deployment finishes, copy the deployed contract IDs from the terminal output into `.env`.

```env
ZETAPAY_VERIFIER_CONTRACT_ID=deployed_verifier_contract_id
ZETAPAY_PAYROLL_CONTRACT_ID=deployed_payroll_contract_id
ZETAPAY_POOL_CONTRACT_ID=deployed_pool_contract_id
```

Then initialize the deployed contracts.

```bash
yarn contracts:initialize:all
```

This initializes the confidential payroll contract and the shielded pool contract using the configured verifier, token, payroll, and pool contract IDs.

---

## 📸 Platform Preview

> _Replace with actual screenshots:_
>
> - Landing Page (`src/app/(marketing)`)
> - Employer Dashboard (`src/app/employer`)
> - Payroll Creation
> - Shielded Pool Withdrawal

```
docs/screenshots/landing.png
docs/screenshots/employer-dashboard.png
docs/screenshots/payroll-history.png
docs/screenshots/shielded-withdrawal.png
```

---

## 🧪 Testing & Verification

### Off‑line Prover Tests

```bash
# Test the payroll circuit
node circuits/payroll/scripts/generate-inputs.js
yarn payroll:prove
yarn payroll:verify

# Test the pool circuits
yarn pool:all
```

### Contract Integration Tests

```bash
yarn contracts:test
```

Runs Rust unit tests for each contract.

### End‑to‑End (Full Stack)

After deploying contracts:

1. Create an enterprise and employees via the UI.
2. Generate a payroll batch.
3. Fund the batch and generate the ZK proof.
4. Submit the proof to the contract via the API.
5. Verify that the contract accepts the root and the payroll is marked as settled.

---

## 📊 Technology Stack

| Category            | Technologies                                                     |
| ------------------- | ---------------------------------------------------------------- |
| **Blockchain**      | Stellar, Soroban, Stellar SDK, Freighter Wallet                  |
| **Zero‑Knowledge**  | Circom 2, Groth16 (BN254), Poseidon, snarkjs, circomlibjs        |
| **Backend**         | Next.js 16 (App Router), TypeScript, PostgreSQL, Drizzle ORM     |
| **Authentication**  | Supabase integration, SSR helpers, cookie based session handling |
| **Frontend**        | React 19, Tailwind CSS, Lucide Icons, Next.js 16                 |
| **Smart Contracts** | Rust (no_std), Soroban SDK, BN254 host functions                 |
| **DevOps**          | Husky, ESLint, Prettier, lint-staged                             |

---

## 🎯 Design Principles

1. **Privacy**: Private payroll records, recipient scoped verification data, audit payloads, and shielded withdrawal ownership are not publicly exposed.
2. **Integrity**: Payroll batches, roots, commitments, and withdrawal claims are verified through Groth16 proofs, public inputs, and Soroban contract checks.
3. **Auditability**: Employers can grant audit keys to authorized third parties.
4. **Scalability**: Batch processing supports up to 128 recipients per transaction.
5. **Transparency**: Public metadata proves payroll existence without revealing sensitive data.

## Security Disclaimer

ZetaPay is an experimental testnet implementation created for hackathon evaluation and technical demonstration.

Before any production use, the system would require independent review of the smart contracts, Circom circuits, trusted setup process, key management, deployment configuration, privacy model, and operational security.

Do not use this implementation with real funds.
