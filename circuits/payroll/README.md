# ZetaPay Payroll Noir Circuit

This circuit generates zero-knowledge proofs for payroll batches.

## What It Proves

1. **Employee commitments are valid** - Each salary commitment matches the employee ID, salary, and salt
2. **Total amount is correct** - The sum of all salaries equals the total amount
3. **Merkle tree membership** - Each employee is part of the payroll Merkle tree
4. **Salary range validation** - Salaries are within valid ranges (1 - 1,000,000)
5. **Public input binding** - The proof is bound to specific public inputs

## How to Use

### 1. Compile the circuit

```bash
nargo compile
```
