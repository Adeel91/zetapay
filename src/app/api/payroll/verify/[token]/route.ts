import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { enterprises, payrollRuns, zkProofs } from '@/lib/db/schema';
import { sha256Hex } from '@/lib/zk/payroll-batch';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const tokenHash = sha256Hex(token);

    const rows = await db
      .select({
        id: payrollRuns.id,
        enterpriseId: payrollRuns.enterpriseId,
        companyName: enterprises.companyName,
        periodStart: payrollRuns.periodStart,
        periodEnd: payrollRuns.periodEnd,
        totalXlm: payrollRuns.totalXlm,
        totalUsdc: payrollRuns.totalUsdc,
        payeeCount: payrollRuns.payeeCount,
        batchSize: payrollRuns.batchSize,
        batchCount: payrollRuns.batchCount,
        batchRoot: payrollRuns.batchRoot,
        payrollRunHash: payrollRuns.payrollRunHash,
        proofHash: payrollRuns.proofHash,
        status: payrollRuns.status,
        createdAt: payrollRuns.createdAt,
      })
      .from(payrollRuns)
      .leftJoin(enterprises, eq(payrollRuns.enterpriseId, enterprises.id))
      .where(eq(payrollRuns.publicVerificationTokenHash, tokenHash))
      .limit(1)
      .execute();

    const payrollRun = rows[0];

    if (!payrollRun) {
      return NextResponse.json({ error: 'Payroll proof record not found' }, { status: 404 });
    }

    const proofRows = await db
      .select()
      .from(zkProofs)
      .where(eq(zkProofs.payrollRunId, payrollRun.id))
      .limit(1)
      .execute();

    const proof = proofRows[0];

    return NextResponse.json({
      verified: Boolean(payrollRun.batchRoot && payrollRun.proofHash),
      payrollRun,
      proof: proof
        ? {
            proofHash: proof.proofHash,
            publicInputs: proof.publicInputs,
            isValid: proof.isValid,
            generatedAt: proof.generatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error verifying public payroll:', error);

    return NextResponse.json(
      {
        error: 'Failed to verify payroll',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
