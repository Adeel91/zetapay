import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  employees,
  enterprises,
  payrollEmployees,
  payrollRuns,
  payrollVerificationLinks,
} from '@/lib/db/schema';
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
        linkId: payrollVerificationLinks.id,
        linkType: payrollVerificationLinks.linkType,
        expiresAt: payrollVerificationLinks.expiresAt,
        usedAt: payrollVerificationLinks.usedAt,
        revokedAt: payrollVerificationLinks.revokedAt,
        employeeName: employees.fullName,
        employeeEmail: employees.email,
        employeeType: employees.type,
        companyName: enterprises.companyName,
        payrollRunId: payrollRuns.id,
        periodStart: payrollRuns.periodStart,
        periodEnd: payrollRuns.periodEnd,
        batchRoot: payrollRuns.batchRoot,
        payrollRunHash: payrollRuns.payrollRunHash,
        proofHash: payrollRuns.proofHash,
        payrollStatus: payrollRuns.status,
        payrollEmployeeId: payrollEmployees.id,
        amount: payrollEmployees.netSalary,
        currency: payrollEmployees.payoutCurrency,
        paymentStatus: payrollEmployees.status,
        commitment: payrollEmployees.commitment,
        merklePath: payrollEmployees.merklePath,
        pathIndices: payrollEmployees.pathIndices,
        txHash: payrollEmployees.txHash,
        paymentVerifiedAt: payrollEmployees.paymentVerifiedAt,
      })
      .from(payrollVerificationLinks)
      .innerJoin(employees, eq(payrollVerificationLinks.employeeId, employees.id))
      .innerJoin(enterprises, eq(payrollVerificationLinks.enterpriseId, enterprises.id))
      .innerJoin(payrollRuns, eq(payrollVerificationLinks.payrollRunId, payrollRuns.id))
      .innerJoin(
        payrollEmployees,
        eq(payrollVerificationLinks.payrollEmployeeId, payrollEmployees.id)
      )
      .where(
        and(
          eq(payrollVerificationLinks.tokenHash, tokenHash),
          eq(payrollVerificationLinks.linkType, 'employee'),
          isNull(payrollVerificationLinks.revokedAt)
        )
      )
      .limit(1)
      .execute();

    const record = rows[0];

    if (!record) {
      return NextResponse.json({ error: 'Payment verification record not found' }, { status: 404 });
    }

    if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Verification link has expired' }, { status: 410 });
    }

    return NextResponse.json({
      verified: Boolean(record.commitment && record.batchRoot && record.proofHash),
      payment: record,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);

    return NextResponse.json(
      {
        error: 'Failed to verify payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const tokenHash = sha256Hex(token);

    const rows = await db
      .select({
        linkId: payrollVerificationLinks.id,
        payrollEmployeeId: payrollVerificationLinks.payrollEmployeeId,
        expiresAt: payrollVerificationLinks.expiresAt,
        revokedAt: payrollVerificationLinks.revokedAt,
      })
      .from(payrollVerificationLinks)
      .where(
        and(
          eq(payrollVerificationLinks.tokenHash, tokenHash),
          eq(payrollVerificationLinks.linkType, 'employee')
        )
      )
      .limit(1)
      .execute();

    const record = rows[0];

    if (!record || record.revokedAt) {
      return NextResponse.json({ error: 'Payment verification record not found' }, { status: 404 });
    }

    if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Verification link has expired' }, { status: 410 });
    }

    const verifiedAt = new Date();

    await db
      .update(payrollVerificationLinks)
      .set({
        usedAt: verifiedAt,
        updatedAt: verifiedAt,
      })
      .where(eq(payrollVerificationLinks.id, record.linkId))
      .execute();

    await db
      .update(payrollEmployees)
      .set({
        paymentVerifiedAt: verifiedAt,
        updatedAt: verifiedAt,
      })
      .where(eq(payrollEmployees.id, record.payrollEmployeeId))
      .execute();

    return NextResponse.json({ success: true, verifiedAt });
  } catch (error) {
    console.error('Error confirming payment verification:', error);

    return NextResponse.json(
      {
        error: 'Failed to confirm verification',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
