# ZetaPay

Privacy preserving payroll powered by Stellar, Zero Knowledge Proofs, and encrypted verification.

---

## Overview

ZetaPay is a payroll platform that allows employers to pay employees while preserving payroll privacy.

Instead of exposing every payment publicly, payrolls are represented by cryptographic commitments, Merkle trees, and Zero Knowledge Proofs. Employees receive private verification links proving their own payment, while auditors receive controlled access using audit keys.

The goal is to make payroll:

- Private
- Auditable
- Cryptographically verifiable
- Blockchain native

---

# Features

## Employer Portal

- Employer authentication
- Enterprise onboarding
- Employee management
- Payroll generation
- Merkle batch creation
- Commitment generation
- Payroll proof generation placeholder
- Employee verification link generation
- Public verification link generation
- Auditor access key generation
- Payroll history
- Payroll details
- Secure encrypted verification tokens

---

## Auditor Portal

- Supabase authentication
- Dashboard
- Audit key verification
- Payroll reports
- Individual report viewer
- Audit history
- Audit log generation

---

## Employee Verification

Employees receive a unique verification link.

They can verify:

- Their payment
- Commitment
- Merkle proof
- Transaction status

without seeing any other employee's salary.

---

## Public Verification

Public verification links expose:

- Payroll totals
- Proof metadata
- Batch root
- Payroll hash

No employee information is exposed.

---

# Security

## Encrypted Tokens

Verification tokens are never stored in plaintext.

Stored values include

- SHA256 token hash
- AES encrypted token payload

Only the encrypted payload can reconstruct the original verification URL.

---

## Audit Keys

Each payroll receives a unique audit key.

Example

```
AUD-3A91-8C27-FE19-0B5D
```

Only authorized auditors can use this key to unlock a payroll report.

---

## Merkle Commitments

Each employee payment becomes a commitment.

Commitments are inserted into a Merkle tree.

Each employee receives

- Merkle path
- Path indices
- Commitment

allowing independent proof verification.

---

# Technology Stack

Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Lucide Icons

Backend

- Next.js Route Handlers
- Drizzle ORM
- PostgreSQL

Authentication

- Supabase Auth

Blockchain

- Stellar
- Soroban

Cryptography

- SHA256
- AES256
- Merkle Trees
- Commitment Hashing
- Groth16 placeholder

---

# Database

Current tables

- enterprises
- employees
- users
- payroll_runs
- payroll_employees
- payroll_verification_links
- audit_logs
- audit_keys
- zk_proofs
- payroll_settings
- transaction_logs

---

# Payroll Flow

```
Employer Login

↓

Create Payroll

↓

Generate Commitments

↓

Build Merkle Tree

↓

Generate Batch Root

↓

Generate Payroll Hash

↓

Store Proof

↓

Generate

• Public Verification Link

• Employee Verification Links

• Auditor Key

↓

Employer Shares

↓

Employees verify privately

↓

Auditors verify using audit key

↓

Public verifies proof metadata
```

---

# Current Project Status

## Completed

✅ Employer authentication

✅ Enterprise onboarding

✅ Employee management

✅ Payroll generation

✅ Merkle tree generation

✅ Commitment generation

✅ Payroll hashing

✅ Public verification

✅ Employee verification

✅ Auditor authentication

✅ Auditor reports

✅ Audit history

✅ Encrypted verification tokens

✅ Secure audit keys

---

## In Progress

- Soroban smart contracts
- Groth16 proof generation
- On chain verification
- Stellar payment execution

---

## Planned

- Batch payroll smart contracts
- On chain proof verification
- Automatic Stellar settlement
- Multi batch payrolls
- Multi enterprise support
- Email delivery
- PDF exports
- Analytics dashboard

---

# Environment Variables

```
DATABASE_URL=

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

TOKEN_ENCRYPTION_KEY=

NEXT_PUBLIC_APP_URL=
```

Generate the encryption key

```
openssl rand -hex 32
```

---

# Local Development

Install

```
npm install
```

Run

```
npm run dev
```

Database

```
npm run db:generate

npm run db:migrate
```

---

# Repository Structure

```
src/

app/

components/

lib/

api/

dashboard/

verify/

auth/

contracts/

scripts/

drizzle/

public/
```

---

# Hackathon Vision

Traditional payroll exposes sensitive employee information.

ZetaPay replaces trust with cryptographic proofs.

Employers prove payroll correctness.

Employees prove individual payments.

Auditors verify compliance.

The public verifies totals.

Nobody learns information they should not have access to.

---

# Current Limitations

Proof generation is currently represented by placeholders.

Real Groth16 proof generation and Soroban verification are the next milestone.

---

# Next Milestone

1. Deploy Soroban contracts

2. Replace placeholder proofs with Groth16

3. Submit payroll batches on chain

4. Verify proofs on chain

5. Execute Stellar payments

6. Record transaction hashes

7. Verify employee payouts on chain

---

# Authors

Built for the Stellar Hackathon.

Powered by Stellar, Soroban, Zero Knowledge Proofs, and privacy first payroll architecture.
