import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { auditLogs, enterprises, payrollRuns, users, zkProofs } from '@/lib/db/schema';
import { decryptPayload } from '@/lib/security/tokenVault';
import { BATCH_SIZE } from '@/lib/zk/payroll-batch';
import { buildMerkleTree } from '@/lib/zk/merkle';
import { getPayrollRecordFromChain } from '@/lib/zetapay/contracts/payroll';

type AuditVerifyRequest = {
  auditKey?: string;
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type EncryptedPayrollAudit = {
  scope?: string;
  enterpriseId?: number;
  enterpriseWallet?: string;
  periodStart?: string;
  periodEnd?: string;
  auditKey?: string;
  payrollRunHash?: string;
  payrollRunHashField?: string;
  batchRoot?: string;
  batchRootHex?: string;
  proofHash?: string;
  batchIndex?: number;
  batchCount?: number;
  totals?: {
    totalGross?: string | number;
    totalXlm?: string | number;
    totalUsdc?: string | number;
    payeeCount?: string | number;
  };
  payees?: {
    employeeId?: number;
    personId?: string;
    walletAddress?: string;
    amount?: string;
    atomicAmount?: string;
    currency?: string;
    type?: string;
    commitment?: string;
    salt?: string;
    payeeIndex?: number;
  }[];
  commitments?: string[];
  publicSignals?: string[];
  createdAt?: string;
};

function getAuditorEmail(cookieValue?: string) {
  if (!cookieValue) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue));
    return typeof parsed.email === 'string' ? parsed.email : null;
  } catch {
    try {
      const parsed = JSON.parse(cookieValue);
      return typeof parsed.email === 'string' ? parsed.email : null;
    } catch {
      return null;
    }
  }
}

function getClientIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

function decryptSafe<TPayload extends Record<string, JsonValue>>(encryptedPayload: string) {
  try {
    return decryptPayload<TPayload>(encryptedPayload);
  } catch {
    return null;
  }
}

function normalizeCommitments(commitments: string[]) {
  const padded = commitments.map((item) => BigInt(item || '0'));

  while (padded.length < BATCH_SIZE) {
    padded.push(BigInt(0));
  }

  return padded.slice(0, BATCH_SIZE);
}

async function verifyChainPayrollAudit(input: { encryptedPayroll: string; chainRoot: string }) {
  const audit = decryptSafe<EncryptedPayrollAudit>(input.encryptedPayroll);

  if (!audit) {
    return {
      verified: false,
      reason: 'Encrypted payroll audit payload could not be decrypted',
      audit: null,
      merkleRoot: null,
    };
  }

  if (!Array.isArray(audit.commitments) || audit.commitments.length === 0) {
    return {
      verified: false,
      reason: 'Encrypted payroll commitment list is missing',
      audit,
      merkleRoot: null,
    };
  }

  const leaves = normalizeCommitments(audit.commitments);
  const tree = await buildMerkleTree(leaves);
  const merkleRoot = tree.root.toString();

  if (merkleRoot !== String(input.chainRoot)) {
    return {
      verified: false,
      reason: 'Merkle root does not match Soroban commitment root',
      audit,
      merkleRoot,
    };
  }

  return {
    verified: true,
    reason: null,
    audit,
    merkleRoot,
  };
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get('zetaRole')?.value;
    const auditorSession = cookieStore.get('auditorSession')?.value;
    const auditorEmail = getAuditorEmail(auditorSession);

    if (role !== 'auditor' || !auditorEmail) {
      return NextResponse.json({ error: 'Unauthorized auditor session' }, { status: 401 });
    }

    const body = (await request.json()) as AuditVerifyRequest;
    const cleanAuditKey = body.auditKey?.trim().toUpperCase();

    if (!cleanAuditKey) {
      return NextResponse.json({ error: 'Audit key is required' }, { status: 400 });
    }

    const [row] = await db
      .select({
        payrollRunId: payrollRuns.id,
        enterpriseId: payrollRuns.enterpriseId,
        contractBatchId: payrollRuns.contractBatchId,
        dbStatus: payrollRuns.status,
        dbTxHash: payrollRuns.txHash,
        dbCreatedAt: payrollRuns.createdAt,
        employerWallet: enterprises.walletAddress,
        companyName: enterprises.companyName,
      })
      .from(payrollRuns)
      .innerJoin(enterprises, eq(enterprises.id, payrollRuns.enterpriseId))
      .where(eq(payrollRuns.auditKey, cleanAuditKey))
      .limit(1)
      .execute();

    if (!row || !row.contractBatchId || !row.employerWallet) {
      return NextResponse.json({ error: 'Invalid audit key' }, { status: 403 });
    }

    const chainRecord = await getPayrollRecordFromChain({
      employer: row.employerWallet,
      batchId: row.contractBatchId,
    });

    const verification = await verifyChainPayrollAudit({
      encryptedPayroll: chainRecord.batch.encryptedPayroll,
      chainRoot: chainRecord.batch.commitmentRoot,
    });

    if (!verification.audit) {
      return NextResponse.json(
        {
          error: 'Could not decrypt chain payroll audit payload',
          message: verification.reason || 'Unknown audit decryption error',
        },
        { status: 500 }
      );
    }

    if (
      verification.audit.auditKey &&
      verification.audit.auditKey.toUpperCase() !== cleanAuditKey
    ) {
      return NextResponse.json(
        { error: 'Audit key does not match chain payload' },
        { status: 403 }
      );
    }

    const [proof] = await db
      .select()
      .from(zkProofs)
      .where(eq(zkProofs.payrollRunId, row.payrollRunId))
      .limit(1)
      .execute();

    const [auditorUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, auditorEmail))
      .limit(1)
      .execute();

    const now = new Date();

    await db
      .insert(auditLogs)
      .values({
        userId: auditorUser?.id || null,
        auditKey: cleanAuditKey,
        payrollRunId: row.payrollRunId,
        enterpriseId: row.enterpriseId,
        action: 'view_payroll',
        status: verification.verified ? 'verified' : 'failed',
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          auditorEmail,
          companyName: row.companyName,
          payrollRunId: row.payrollRunId,
          source: 'soroban encrypted payroll audit',
          chainSource: true,
          merkleVerified: verification.verified,
          merkleFailureReason: verification.reason,
        },
      })
      .execute();

    const audit = verification.audit;

    const report = {
      payrollRunId: row.payrollRunId,
      companyName: row.companyName,
      periodStart: audit.periodStart,
      periodEnd: audit.periodEnd,
      totalXlm: audit.totals?.totalXlm ?? null,
      totalUsdc: audit.totals?.totalUsdc ?? null,
      totalGross: audit.totals?.totalGross ?? null,
      totalNet: audit.totals?.totalGross ?? null,
      payeeCount:
        audit.totals?.payeeCount ?? audit.payees?.length ?? chainRecord.batch.payment_count,
      batchCount: audit.batchCount ?? chainRecord.batch.batch_count,
      batchRoot: chainRecord.batch.commitmentRoot,
      payrollRunHash: chainRecord.batch.payrollRunHash,
      proofHash: chainRecord.batch.proofHash,
      status: row.dbStatus,
      txHash: row.dbTxHash,
      verifiedAt: now.toISOString(),
      source: 'soroban_contract_encrypted_payroll',
      merkleVerification: {
        verified: verification.verified,
        reason: verification.reason,
        merkleRoot: verification.merkleRoot,
        chainRoot: chainRecord.batch.commitmentRoot,
      },
      proof: proof
        ? {
            proofHash: proof.proofHash,
            isValid: proof.isValid,
            generatedAt: proof.generatedAt,
            publicInputs: proof.publicInputs,
          }
        : null,
      payees: (audit.payees || []).map((payee) => ({
        id: payee.payeeIndex,
        employeeId: payee.employeeId,
        personId: payee.personId,
        employeeName: payee.personId ? `Payee ${payee.personId}` : `Payee ${payee.payeeIndex}`,
        employeeEmail: null,
        employeeWallet: payee.walletAddress,
        employeeType: payee.type,
        amount: payee.amount,
        atomicAmount: payee.atomicAmount,
        currency: payee.currency,
        status: row.dbStatus,
        commitment: payee.commitment,
        salt: payee.salt,
        batchIndex: audit.batchIndex ?? chainRecord.batch.batch_index,
        payeeIndex: payee.payeeIndex,
        source: 'decrypted_chain_payload',
      })),
    };

    return NextResponse.json({
      success: true,
      payrollRunId: row.payrollRunId,
      report,
    });
  } catch (error) {
    console.error('Error verifying audit key:', error);

    return NextResponse.json(
      {
        error: 'Failed to verify audit key',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
