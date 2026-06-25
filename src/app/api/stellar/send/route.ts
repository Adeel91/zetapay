/**
 * POST /api/stellar/send
 *
 * Accepts a full payroll batch from the frontend (ZK proof + employee array),
 * builds a Soroban `submit_batch` transaction using @stellar/stellar-sdk,
 * signs it with the server-side keypair, submits it to the Stellar testnet,
 * and writes the resulting on-chain batch ID / tx hash to the database.
 *
 * Expected request body
 * ─────────────────────
 * {
 *   proof:          string;         // hex-encoded Barretenberg proof bytes
 *   publicInputs:   string[];       // BN254 Fr commitment per employee (hex)
 *   merkleRoot:     string;         // 32-byte Poseidon2 root (0x-prefixed hex)
 *   totalAmount:    number;         // sum of all employee amounts (micro-USDC)
 *   periodStart:    number;         // Unix timestamp
 *   periodEnd:      number;         // Unix timestamp
 *   employees: Array<{
 *     employeeId:        number;    // DB employee ID (for record lookup)
 *     address:           string;    // Stellar G-address (wallet)
 *     amountUsdc:        number;    // individual payout (micro-USDC / stroops)
 *     salaryCommitment:  string;    // 32-byte Poseidon2 commitment (0x hex)
 *     merkleProof:       string[];  // 32 sibling hashes (0x hex each)
 *     merkleIndex:       number;    // leaf index in the commitment tree
 *   }>;
 * }
 *
 * Required environment variables
 * ───────────────────────────────
 * STELLAR_SERVER_SECRET   — ed25519 secret key (S…) for the server signing account
 * PAYROLL_CONTRACT_ID     — Soroban contract address (C…)
 * NEXT_PUBLIC_SOROBAN_RPC — Soroban RPC URL (defaults to testnet)
 */

import { NextResponse }          from 'next/server';
import { cookies }               from 'next/headers';
import {
  rpc          as SorobanRpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Keypair,
  Address       as StellarAddress,
  nativeToScVal,
  xdr,
}                                from '@stellar/stellar-sdk';
import { db }                    from '@/lib/db';
import {
  payrollRuns,
  payrollEmployees,
  employees   as employeesTable,
  zkProofs,
  transactionLogs,
}                                from '@/lib/db/schema';
import { eq, and, inArray }      from 'drizzle-orm';
import crypto                    from 'crypto';

// ---------------------------------------------------------------------------
// Soroban RPC client
// ---------------------------------------------------------------------------

const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC ?? 'https://soroban-testnet.stellar.org';
const sorobanServer   = new SorobanRpc.Server(SOROBAN_RPC_URL, { allowHttp: false });

// ---------------------------------------------------------------------------
// XDR helpers — encode Soroban #[contracttype] structs exactly as the WASM
// ABI expects them (ScMap with symbol keys in lexicographic order).
// ---------------------------------------------------------------------------

/**
 * Decode a 0x-prefixed or raw hex string into a fixed-length Buffer.
 * Pads with leading zeros if the decoded length is shorter than `expectedBytes`.
 */
function hexToBuffer(hex: string, expectedBytes: number): Buffer {
  const raw = hex.replace(/^0x/i, '').padStart(expectedBytes * 2, '0');
  return Buffer.from(raw, 'hex');
}

/**
 * Build the `ScVal` for one `PayrollEmployee` contract struct.
 *
 * Fields must appear in ascending lexicographic order (Soroban ScMap invariant).
 * After the rename `amount_usdc` → `payout_amount` the correct order is:
 *   address < merkle_index < merkle_proof < payout_amount < salary_commitment
 *
 * ('p' > 'm' in ASCII, so payout_amount sorts after the merkle_* fields.)
 */
function encodeEmployee(emp: {
  address:          string;
  payoutAmount:     bigint;
  salaryCommitment: string;
  merkleProof:      string[];
  merkleIndex:      bigint;
}): xdr.ScVal {
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('address'),
      val: StellarAddress.fromString(emp.address).toScVal(),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('merkle_index'),
      val: nativeToScVal(emp.merkleIndex, { type: 'u64' }),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('merkle_proof'),
      val: xdr.ScVal.scvVec(
        emp.merkleProof.map((h) =>
          xdr.ScVal.scvBytes(hexToBuffer(h, 32)),
        ),
      ),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('payout_amount'),
      val: nativeToScVal(emp.payoutAmount, { type: 'i128' }),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('salary_commitment'),
      val: xdr.ScVal.scvBytes(hexToBuffer(emp.salaryCommitment, 32)),
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // ── 0. Auth ────────────────────────────────────────────────────────────────
  const cookieStore  = await cookies();
  const enterpriseId = cookieStore.get('enterpriseId')?.value;
  if (!enterpriseId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 1. Parse & validate request body ──────────────────────────────────────
  let body: {
    proof:        string;
    publicInputs: string[];
    merkleRoot:   string;
    totalAmount:  number;
    periodStart:  number;
    periodEnd:    number;
    employees: Array<{
      employeeId:       number;
      address:          string;
      payoutAmount:     number;
      salaryCommitment: string;
      merkleProof:      string[];
      merkleIndex:      number;
    }>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { proof, publicInputs, merkleRoot, totalAmount, periodStart, periodEnd, employees } = body;

  if (!proof || !publicInputs?.length || !merkleRoot || !employees?.length) {
    return NextResponse.json(
      { error: 'Missing required fields: proof, publicInputs, merkleRoot, employees' },
      { status: 400 },
    );
  }
  if (typeof totalAmount !== 'number' || totalAmount <= 0) {
    return NextResponse.json({ error: 'totalAmount must be a positive number' }, { status: 400 });
  }
  if (employees.length !== publicInputs.length) {
    return NextResponse.json(
      { error: `employees.length (${employees.length}) != publicInputs.length (${publicInputs.length})` },
      { status: 400 },
    );
  }

  // ── 2. Look up DB employee records for all submitted wallet addresses ──────
  const submittedIds = employees.map((e) => e.employeeId);
  const dbEmployees  = await db
    .select()
    .from(employeesTable)
    .where(
      and(
        inArray(employeesTable.id, submittedIds),
        eq(employeesTable.enterpriseId, parseInt(enterpriseId)),
      ),
    )
    .execute();

  if (dbEmployees.length !== employees.length) {
    return NextResponse.json(
      { error: 'One or more employee IDs not found in this enterprise.' },
      { status: 404 },
    );
  }

  // ── 3. Verify the server can sign ─────────────────────────────────────────
  const serverSecret = process.env.STELLAR_SERVER_SECRET;
  if (!serverSecret) {
    return NextResponse.json(
      { error: 'STELLAR_SERVER_SECRET is not configured on this server.' },
      { status: 503 },
    );
  }
  const contractId = process.env.PAYROLL_CONTRACT_ID;
  if (!contractId) {
    return NextResponse.json(
      { error: 'PAYROLL_CONTRACT_ID is not configured on this server.' },
      { status: 503 },
    );
  }

  const serverKeypair = Keypair.fromSecret(serverSecret);

  // ── 4. Build Soroban transaction args ─────────────────────────────────────

  // employer = server signing account (authorized to execute payroll)
  const employerScVal = StellarAddress.fromString(serverKeypair.publicKey()).toScVal();

  // Vec<PayrollEmployee>
  const employeesScVal = xdr.ScVal.scvVec(
    employees.map((e) =>
      encodeEmployee({
        address:          e.address,
        payoutAmount:     BigInt(e.payoutAmount),
        salaryCommitment: e.salaryCommitment,
        merkleProof:      e.merkleProof,
        merkleIndex:      BigInt(e.merkleIndex),
      }),
    ),
  );

  // zk_proof: raw proof bytes (hex → Bytes)
  const proofBuffer  = Buffer.from(proof.replace(/^0x/i, ''), 'hex');
  const zkProofScVal = xdr.ScVal.scvBytes(proofBuffer);

  // Vec<BytesN<32>> public_inputs
  const publicInputsScVal = xdr.ScVal.scvVec(
    publicInputs.map((pi) => xdr.ScVal.scvBytes(hexToBuffer(pi, 32))),
  );

  // i128 total_amount
  const totalAmountScVal = nativeToScVal(BigInt(totalAmount), { type: 'i128' });

  // u64 period_start / period_end
  const periodStartScVal = nativeToScVal(
    BigInt(periodStart ?? Math.floor(Date.now() / 1000)),
    { type: 'u64' },
  );
  const periodEndScVal = nativeToScVal(
    BigInt(periodEnd ?? Math.floor(Date.now() / 1000) + 2_592_000),
    { type: 'u64' },
  );

  // BytesN<32> merkle_root
  const merkleRootScVal = xdr.ScVal.scvBytes(hexToBuffer(merkleRoot, 32));

  // ── 5. Build, simulate, assemble, sign, and submit the transaction ─────────
  let txHash: string;
  let onChainBatchId: string | null = null;

  try {
    const account = await sorobanServer.getAccount(serverKeypair.publicKey());

    const contract = new Contract(contractId);
    const operation = contract.call(
      'submit_batch',
      employerScVal,
      employeesScVal,
      zkProofScVal,
      publicInputsScVal,
      totalAmountScVal,
      periodStartScVal,
      periodEndScVal,
      merkleRootScVal,
    );

    const rawTx = new TransactionBuilder(account, {
      fee:              BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(operation)
      .setTimeout(300)
      .build();

    // Simulate to obtain resource limits and auth entries
    const simResult = await sorobanServer.simulateTransaction(rawTx);
    if (SorobanRpc.Api.isSimulationError(simResult)) {
      return NextResponse.json(
        { error: `Soroban simulation failed: ${simResult.error}` },
        { status: 422 },
      );
    }

    const preparedTx = SorobanRpc.assembleTransaction(rawTx, simResult).build();
    preparedTx.sign(serverKeypair);

    const sendResult = await sorobanServer.sendTransaction(preparedTx);
    txHash = sendResult.hash;

    if (sendResult.status === 'ERROR') {
      return NextResponse.json(
        { error: `Transaction submission failed: ${JSON.stringify(sendResult.errorResult)}` },
        { status: 422 },
      );
    }

    // Poll until the transaction is included in a ledger (up to ~30 s)
    if (sendResult.status === 'PENDING') {
      let getResult = await sorobanServer.getTransaction(txHash);
      const deadline = Date.now() + 30_000;

      while (getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2_000));
        getResult = await sorobanServer.getTransaction(txHash);
      }

      if (getResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        // Extract the returned batch_id (u64) from the contract invocation result
        try {
          const returnVal = getResult.returnValue;
          if (returnVal?.switch() === xdr.ScValType.scvU64()) {
            onChainBatchId = returnVal.u64().toString();
          }
        } catch {
          // Non-critical — batch ID extraction failed but tx succeeded
        }
      } else if (getResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        return NextResponse.json(
          { error: `Contract invocation failed on-chain. txHash: ${txHash}` },
          { status: 422 },
        );
      }
    }
  } catch (err) {
    console.error('[send/route] Soroban transaction error:', err);
    return NextResponse.json(
      { error: `Blockchain submission error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  // ── 6. Write DB records ────────────────────────────────────────────────────

  const auditKey    = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
  const proofDigest = '0x' + crypto.createHash('sha256').update(Buffer.from(proof.replace(/^0x/i, ''), 'hex')).digest('hex').slice(0, 62);

  const [payrollRun] = await db
    .insert(payrollRuns)
    .values({
      enterpriseId:     parseInt(enterpriseId),
      runDate:          new Date(),
      periodStart:      periodStart ? new Date(periodStart * 1000) : new Date(),
      periodEnd:        periodEnd   ? new Date(periodEnd   * 1000) : new Date(),
      totalGross:       totalAmount.toString(),
      totalNet:         totalAmount.toString(),
      totalTaxWithheld: '0',
      totalDeductions:  '0',
      auditKey,
      proofHash:        proofDigest,
      proofPublicInputs: publicInputs,
      status:           'completed',
      processedBy:      'system',
      processedAt:      new Date(),
      notes:            `Batch payroll — ${employees.length} recipients. Contract batch #${onChainBatchId ?? 'pending'}`,
      txHash,
    })
    .returning()
    .execute();

  // Insert one payrollEmployee row per recipient
  const payrollEmployeeRows = await db
    .insert(payrollEmployees)
    .values(
      employees.map((emp) => ({
        payrollRunId:   payrollRun.id,
        employeeId:     emp.employeeId,
        grossSalary:    emp.payoutAmount.toString(),
        netSalary:      emp.payoutAmount.toString(),
        taxWithheld:    '0',
        federalTax:     '0',
        stateTax:       '0',
        localTax:       '0',
        socialSecurity: '0',
        medicare:       '0',
        deductions:     '0',
        bonuses:        '0',
        commissions:    '0',
        reimbursements: '0',
        status:         'completed' as const,
        txHash,
        processedAt:    new Date(),
      })),
    )
    .returning()
    .execute();

  // Store ZK proof blob
  const [zkProofRecord] = await db
    .insert(zkProofs)
    .values({
      payrollRunId: payrollRun.id,
      proofHash:    proofDigest,
      proofData:    Buffer.from(proof.replace(/^0x/i, ''), 'hex').toString('base64'),
      publicInputs,
      verifyingKeyHash: null,
      isValid:      true,
      generatedAt:  new Date(),
    })
    .returning()
    .execute();

  // One transaction log for the entire batch
  await db
    .insert(transactionLogs)
    .values({
      txHash,
      enterpriseId:       parseInt(enterpriseId),
      payrollRunId:       payrollRun.id,
      payrollEmployeeId:  payrollEmployeeRows[0]?.id ?? null,
      fromAddress:        serverKeypair.publicKey(),
      toAddress:          contractId,
      amount:             totalAmount.toString(),
      currency:           'USDC',
      memo:               `ZetaPay batch payroll — ${employees.length} employees`,
      status:             'completed',
      fee:                '0',
      stellarCreatedAt:   new Date(),
    })
    .execute();

  // ── 7. Return success ──────────────────────────────────────────────────────

  return NextResponse.json({
    success:          true,
    txHash,
    onChainBatchId,
    payrollRunId:     payrollRun.id,
    employeeCount:    employees.length,
    totalAmount,
    zkProof: {
      id:      zkProofRecord.id,
      hash:    proofDigest,
      isValid: true,
    },
  });
}
