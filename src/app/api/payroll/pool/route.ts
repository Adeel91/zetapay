import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import { employees, enterprises, payrollEmployees, payrollRuns } from '@/lib/db/schema';
import { BATCH_SIZE } from '@/lib/zk/payroll-batch';
import { encryptPayload } from '@/lib/security/tokenVault';
import {
  buildFundPayrollXdr,
  buildInitializeShieldedPoolXdr,
  buildRegisterTokenXdr,
  getNote,
  isPoolContractInitialized,
  isTokenRegistered,
  sendSignedPoolXdr,
} from '@/lib/zetapay/contracts/pool';
import { zetapayConfig } from '@/lib/zetapay/contracts/config';

export const runtime = 'nodejs';

type PoolPayrollRequest = {
  action?: 'prepare' | 'submitSigned';
  walletAddress?: string;
  periodStart?: string;
  periodEnd?: string;
  payrollMode?: 'shielded_pool';
  items?: {
    personId: string;
    amount: string;
    currency: 'XLM' | 'USDC';
  }[];
  payrollRunId?: number;
  signedXdr?: string;
};

type PoolNotePayload = {
  employeeId: number;
  personId: string;
  walletAddress: string;
  amount: string;
  atomicAmount: string;
  currency: 'XLM' | 'USDC';
  token: string;
  tokenHash: string;
  secret: string;
  nullifier: string;
  nullifierHash: string;
  salt: string;
  commitment: string;
  recipientHash: string;
  withdrawalHash: string;
  payeeIndex: number;
};

type StoredPoolPayload = {
  root: string;
  notes: PoolNotePayload[];
  encryptedPayroll: string;
  encryptedNotes: string[];
  totals: {
    xlm: number;
    usdc: number;
    gross: number;
  };
};

const FIELD_MODULUS = BigInt(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

function generateAuditKey() {
  const hex = crypto.randomBytes(10).toString('hex').toUpperCase();

  return `AUD${hex.slice(0, 4)}${hex.slice(4, 8)}${hex.slice(8, 12)}${hex.slice(12, 16)}${hex.slice(16, 20)}`;
}

function sha256Hex(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashToField(...values: string[]) {
  const hash = sha256Hex(values.join(':'));
  return (BigInt(`0x${hash}`) % FIELD_MODULUS).toString();
}

function randomField() {
  return hashToField(crypto.randomBytes(32).toString('hex'));
}

function toAtomicAmount(amount: string) {
  return Math.round(Number(amount) * 10_000_000).toString();
}

function tokenForCurrency(currency: 'XLM' | 'USDC') {
  return currency === 'XLM' ? zetapayConfig.xlmTokenContract : zetapayConfig.usdcTokenContract;
}

function tokenHashForCurrency(currency: 'XLM' | 'USDC') {
  return currency === 'XLM' ? '0' : '1';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeMetadata(current: unknown, next: Record<string, unknown>) {
  const base = isRecord(current) ? current : {};
  const currentSoroban = isRecord(base.soroban) ? base.soroban : {};
  const nextSoroban = isRecord(next.soroban) ? next.soroban : {};

  return {
    ...base,
    ...next,
    soroban: {
      ...currentSoroban,
      ...nextSoroban,
    },
  };
}

function getStoredPoolPayload(metadata: unknown): StoredPoolPayload {
  if (!isRecord(metadata)) throw new Error('Missing pool payload');

  const soroban = metadata.soroban;
  if (!isRecord(soroban)) throw new Error('Missing pool payload');

  const payload = soroban.poolPayload;
  if (!isRecord(payload)) throw new Error('Missing pool payload');

  return payload as StoredPoolPayload;
}

async function getSessionEnterprise() {
  const cookieStore = await cookies();
  const enterpriseIdStr = cookieStore.get('enterpriseId')?.value;

  if (!enterpriseIdStr) return null;

  const enterpriseId = Number.parseInt(enterpriseIdStr, 10);
  if (Number.isNaN(enterpriseId)) return null;

  const [enterprise] = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.id, enterpriseId))
    .limit(1)
    .execute();

  if (!enterprise || !enterprise.isActive) return null;

  return enterprise;
}

function assertWalletMatchesEnterprise(
  walletAddress: string | undefined,
  enterpriseWallet: string
) {
  if (!walletAddress) throw new Error('Connected wallet address is required');

  if (walletAddress !== enterpriseWallet) {
    throw new Error('Connected Freighter wallet does not match this enterprise wallet.');
  }
}

async function loadMerkleHelpers() {
  const modulePath = path.join(process.cwd(), 'circuits/payroll/scripts/merkle.js');
  const moduleUrl = pathToFileURL(modulePath).href;

  const dynamicImport = new Function('moduleUrl', 'return import(moduleUrl);') as (
    moduleUrl: string
  ) => Promise<{
    poseidonHash: (values: bigint[]) => Promise<bigint>;
    buildMerkleTree: (values: string[]) => Promise<{ root: bigint }>;
  }>;

  return dynamicImport(moduleUrl);
}

async function isPoolInitialized(source: string) {
  return await isPoolContractInitialized({ source });
}

async function noteExists(source: string, commitment: string) {
  try {
    await getNote({ source, commitment });
    return true;
  } catch {
    return false;
  }
}

async function buildPoolPayload({
  enterprise,
  periodStart,
  periodEnd,
  orderedItems,
  auditKey,
}: {
  enterprise: typeof enterprises.$inferSelect;
  periodStart: string;
  periodEnd: string;
  orderedItems: {
    item: {
      personId: string;
      amount: string;
      currency: 'XLM' | 'USDC';
    };
    employee: typeof employees.$inferSelect;
  }[];
  auditKey: string;
}): Promise<StoredPoolPayload> {
  const { poseidonHash, buildMerkleTree } = await loadMerkleHelpers();

  const notes: PoolNotePayload[] = [];

  for (const [index, { item, employee }] of orderedItems.entries()) {
    const atomicAmount = toAtomicAmount(item.amount);
    const tokenHash = tokenHashForCurrency(item.currency);
    const secret = randomField();
    const nullifier = randomField();
    const salt = randomField();
    const recipientHash = hashToField(employee.walletAddress);
    const nullifierHash = (await poseidonHash([BigInt(nullifier)])).toString();

    const commitment = (
      await poseidonHash([
        BigInt(secret),
        BigInt(nullifier),
        BigInt(atomicAmount),
        BigInt(tokenHash),
        BigInt(salt),
      ])
    ).toString();

    const withdrawalHash = (
      await poseidonHash([
        BigInt(nullifierHash),
        BigInt(recipientHash),
        BigInt(atomicAmount),
        BigInt(tokenHash),
      ])
    ).toString();

    notes.push({
      employeeId: employee.id,
      personId: item.personId,
      walletAddress: employee.walletAddress,
      amount: item.amount,
      atomicAmount,
      currency: item.currency,
      token: tokenForCurrency(item.currency),
      tokenHash,
      secret,
      nullifier,
      nullifierHash,
      salt,
      commitment,
      recipientHash,
      withdrawalHash,
      payeeIndex: index,
    });
  }

  const paddedCommitments = [
    ...notes.map((note) => note.commitment),
    ...Array.from({ length: BATCH_SIZE - notes.length }, () => '0'),
  ];

  const tree = await buildMerkleTree(paddedCommitments);
  const root = tree.root.toString();

  const encryptedNotes = notes.map((note) =>
    encryptPayload({
      scope: 'shieldedPoolWithdrawalNote',
      enterpriseId: enterprise.id,
      auditKey,
      periodStart,
      periodEnd,
      root,
      ...note,
      createdAt: new Date().toISOString(),
    })
  );

  const totals = {
    xlm: orderedItems
      .filter(({ item }) => item.currency === 'XLM')
      .reduce((sum, { item }) => sum + Number(item.amount), 0),
    usdc: orderedItems
      .filter(({ item }) => item.currency === 'USDC')
      .reduce((sum, { item }) => sum + Number(item.amount), 0),
    gross: orderedItems.reduce((sum, { item }) => sum + Number(item.amount), 0),
  };

  const encryptedPayroll = encryptPayload({
    scope: 'shieldedPoolPayrollAudit',
    enterpriseId: enterprise.id,
    enterpriseWallet: enterprise.walletAddress,
    auditKey,
    periodStart,
    periodEnd,
    root,
    totals,
    notes,
    createdAt: new Date().toISOString(),
  });

  return {
    root,
    notes,
    encryptedPayroll,
    encryptedNotes,
    totals,
  };
}

async function buildNextPoolXdr({
  source,
  payload,
}: {
  source: string;
  payload: StoredPoolPayload;
}) {
  const initialized = await isPoolInitialized(source);

  if (!initialized) {
    return await buildInitializeShieldedPoolXdr({ admin: source });
  }

  const tokens = Array.from(new Set(payload.notes.map((note) => note.token)));

  for (const token of tokens) {
    const registered = await isTokenRegistered({ source, token });

    if (!registered) {
      return await buildRegisterTokenXdr({
        admin: source,
        token,
      });
    }
  }

  const missingNotes = [];

  for (const note of payload.notes) {
    const exists = await noteExists(source, note.commitment);

    if (!exists) {
      missingNotes.push(note);
    }
  }

  if (missingNotes.length > 0) {
    return await buildFundPayrollXdr({
      admin: source,
      root: payload.root,
      deposits: missingNotes.map((note) => ({
        token: note.token,
        amount: note.atomicAmount,
        commitment: note.commitment,
      })),
    });
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PoolPayrollRequest;
    const action = body.action || 'prepare';

    const enterprise = await getSessionEnterprise();

    if (!enterprise) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    assertWalletMatchesEnterprise(body.walletAddress, enterprise.walletAddress);

    if (action === 'prepare') {
      return await preparePoolPayroll(body, enterprise);
    }

    if (action === 'submitSigned') {
      return await submitSignedPoolPayroll(body, enterprise);
    }

    return NextResponse.json({ error: 'Unsupported pool payroll action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing shielded pool payroll:', error);

    return NextResponse.json(
      {
        error: 'Failed to process shielded pool payroll',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function preparePoolPayroll(
  body: PoolPayrollRequest,
  enterprise: typeof enterprises.$inferSelect
) {
  const periodStart = body.periodStart;
  const periodEnd = body.periodEnd;

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: 'Payroll period is required' }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'At least one payee is required' }, { status: 400 });
  }

  if (body.items.length > BATCH_SIZE) {
    return NextResponse.json(
      { error: `This endpoint currently supports ${BATCH_SIZE} payees.` },
      { status: 400 }
    );
  }

  const employeeIds = body.items.map((item) => Number.parseInt(item.personId, 10));

  if (employeeIds.some((id) => Number.isNaN(id))) {
    return NextResponse.json({ error: 'Invalid payee id' }, { status: 400 });
  }

  const employeeRows = await db
    .select()
    .from(employees)
    .where(and(inArray(employees.id, employeeIds), eq(employees.enterpriseId, enterprise.id)))
    .execute();

  if (employeeRows.length !== employeeIds.length) {
    return NextResponse.json(
      { error: 'One or more payees do not belong to this enterprise' },
      { status: 400 }
    );
  }

  const employeeById = new Map(employeeRows.map((employee) => [employee.id, employee]));

  const orderedItems = body.items.map((item) => {
    const employee = employeeById.get(Number.parseInt(item.personId, 10));

    if (!employee) {
      throw new Error(`Employee ${item.personId} not found`);
    }

    return { item, employee };
  });

  const auditKey = generateAuditKey();

  const payload = await buildPoolPayload({
    enterprise,
    periodStart,
    periodEnd,
    orderedItems,
    auditKey,
  });

  const nextXdr = await buildNextPoolXdr({
    source: enterprise.walletAddress,
    payload,
  });

  if (!nextXdr) {
    throw new Error('No pool transaction was prepared.');
  }

  const [payrollRun] = await db
    .insert(payrollRuns)
    .values({
      enterpriseId: enterprise.id,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      totalGross: payload.totals.gross.toString(),
      totalNet: payload.totals.gross.toString(),
      totalTaxWithheld: '0',
      totalDeductions: '0',
      totalXlm: payload.totals.xlm.toString(),
      totalUsdc: payload.totals.usdc.toString(),
      payeeCount: orderedItems.length,
      batchSize: BATCH_SIZE,
      batchCount: 1,
      batchRoot: payload.root,
      payrollRunHash: payload.root,
      auditKey,
      proofHash: sha256Hex(payload.root),
      proofPublicInputs: {
        root: payload.root,
        commitments: payload.notes.map((note) => note.commitment),
      },
      status: 'pending',
      processedBy: enterprise.walletAddress,
      runDate: new Date(),
      metadata: {
        generatedBy: 'payroll-review',
        settlementMode: 'shielded_pool',
        sourceOfTruth: 'soroban',
        encryptedPayroll: payload.encryptedPayroll,
        encryptedNotes: payload.encryptedNotes,
        soroban: {
          stage: 'prepared',
          poolContractId: zetapayConfig.poolContractId,
          verifierContractId: zetapayConfig.verifierContractId,
          poolPayload: payload,
          txHashes: [],
        },
      },
    })
    .returning()
    .execute();

  for (const note of payload.notes) {
    await db
      .insert(payrollEmployees)
      .values({
        payrollRunId: payrollRun.id,
        employeeId: note.employeeId,
        payoutCurrency: note.currency,
        grossSalary: note.amount,
        netSalary: note.amount,
        taxWithheld: '0',
        federalTax: '0',
        stateTax: '0',
        localTax: '0',
        socialSecurity: '0',
        medicare: '0',
        deductions: '0',
        bonuses: '0',
        commissions: '0',
        reimbursements: '0',
        batchIndex: 0,
        payeeIndex: note.payeeIndex,
        salt: note.salt,
        commitment: note.commitment,
        merklePath: [],
        pathIndices: [],
        encryptedMetadata: payload.encryptedNotes[note.payeeIndex],
        status: 'pending',
      })
      .execute();
  }

  return NextResponse.json(
    {
      success: true,
      step: 'prepared',
      payrollRunId: payrollRun.id,
      employer: enterprise.walletAddress,
      initializeXdr: null,
      submitXdr: nextXdr,
      batchRoot: payload.root,
      payrollRunHash: payload.root,
      proofHash: payrollRun.proofHash,
      totals: {
        xlm: payload.totals.xlm,
        usdc: payload.totals.usdc,
        payeeCount: orderedItems.length,
        batchCount: 1,
      },
    },
    { status: 201 }
  );
}

async function submitSignedPoolPayroll(
  body: PoolPayrollRequest,
  enterprise: typeof enterprises.$inferSelect
) {
  if (!body.payrollRunId) {
    return NextResponse.json({ error: 'Payroll run id is required' }, { status: 400 });
  }

  if (!body.signedXdr) {
    return NextResponse.json({ error: 'Signed pool XDR is required' }, { status: 400 });
  }

  const [payrollRun] = await db
    .select()
    .from(payrollRuns)
    .where(and(eq(payrollRuns.id, body.payrollRunId), eq(payrollRuns.enterpriseId, enterprise.id)))
    .limit(1)
    .execute();

  if (!payrollRun) {
    return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
  }

  const payload = getStoredPoolPayload(payrollRun.metadata);
  const submitResult = await sendSignedPoolXdr(body.signedXdr);

  const currentHashes =
    isRecord(payrollRun.metadata) &&
    isRecord(payrollRun.metadata.soroban) &&
    Array.isArray(payrollRun.metadata.soroban.txHashes)
      ? payrollRun.metadata.soroban.txHashes
      : [];

  const txHashes = [...currentHashes, submitResult.txHash];

  const nextXdr = await buildNextPoolXdr({
    source: enterprise.walletAddress,
    payload,
  });

  if (nextXdr) {
    await db
      .update(payrollRuns)
      .set({
        metadata: mergeMetadata(payrollRun.metadata, {
          soroban: {
            stage: 'pool_transaction_submitted',
            lastTxHash: submitResult.txHash,
            txHashes,
          },
        }),
        updatedAt: new Date(),
      })
      .where(eq(payrollRuns.id, payrollRun.id))
      .execute();

    return NextResponse.json({
      success: true,
      step: 'prepared',
      payrollRunId: payrollRun.id,
      employer: enterprise.walletAddress,
      submitTxHash: submitResult.txHash,
      submitXdr: nextXdr,
      batchRoot: payrollRun.batchRoot,
      payrollRunHash: payrollRun.payrollRunHash,
      proofHash: payrollRun.proofHash,
      status: payrollRun.status,
      totals: {
        xlm: Number(payrollRun.totalXlm),
        usdc: Number(payrollRun.totalUsdc),
        payeeCount: payrollRun.payeeCount || 0,
        batchCount: payrollRun.batchCount || 1,
      },
    });
  }

  const [updatedPayrollRun] = await db
    .update(payrollRuns)
    .set({
      txHash: submitResult.txHash,
      status: 'completed',
      processedBy: enterprise.walletAddress,
      processedAt: new Date(),
      metadata: mergeMetadata(payrollRun.metadata, {
        soroban: {
          stage: 'pool_funded',
          lastTxHash: submitResult.txHash,
          txHashes,
        },
      }),
      updatedAt: new Date(),
    })
    .where(eq(payrollRuns.id, payrollRun.id))
    .returning()
    .execute();

  await db
    .update(payrollEmployees)
    .set({
      status: 'completed',
      processedAt: new Date(),
      paymentVerifiedAt: new Date(),
      txHash: submitResult.txHash,
      updatedAt: new Date(),
    })
    .where(eq(payrollEmployees.payrollRunId, payrollRun.id))
    .execute();

  return NextResponse.json({
    success: true,
    step: 'executed',
    payrollRunId: updatedPayrollRun.id,
    status: updatedPayrollRun.status,
    batchRoot: updatedPayrollRun.batchRoot,
    payrollRunHash: updatedPayrollRun.payrollRunHash,
    proofHash: updatedPayrollRun.proofHash,
    txHash: submitResult.txHash,
    submitTxHash: submitResult.txHash,
    executeTxHash: submitResult.txHash,
    employerPayrollUrl: `/dashboard/employer/payroll/${updatedPayrollRun.id}`,
    totals: {
      xlm: Number(updatedPayrollRun.totalXlm),
      usdc: Number(updatedPayrollRun.totalUsdc),
      payeeCount: updatedPayrollRun.payeeCount || 0,
      batchCount: updatedPayrollRun.batchCount || 1,
    },
  });
}
