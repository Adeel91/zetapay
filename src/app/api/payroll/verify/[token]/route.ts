import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { employees, payrollEmployees, payrollRuns, zkProofs } from '@/lib/db/schema';
import { sha256Hex } from '@/lib/zk/payroll-batch';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const tokenHash = sha256Hex(token);

    const payrollResult = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.verificationTokenHash, tokenHash))
      .limit(1)
      .execute();

    const payrollRun = payrollResult[0];

    if (!payrollRun) {
      return NextResponse.json({ error: 'Payroll verification record not found' }, { status: 404 });
    }

    const proofResult = await db
      .select()
      .from(zkProofs)
      .where(eq(zkProofs.payrollRunId, payrollRun.id))
      .limit(1)
      .execute();

    const payrollEmployeeRows = await db
      .select({
        id: payrollEmployees.id,
        employeeId: payrollEmployees.employeeId,
        payoutCurrency: payrollEmployees.payoutCurrency,
        grossSalary: payrollEmployees.grossSalary,
        netSalary: payrollEmployees.netSalary,
        status: payrollEmployees.status,
        commitment: payrollEmployees.commitment,
        batchIndex: payrollEmployees.batchIndex,
        payeeIndex: payrollEmployees.payeeIndex,
        txHash: payrollEmployees.txHash,
        employeeName: employees.fullName,
        employeeType: employees.type,
      })
      .from(payrollEmployees)
      .leftJoin(employees, eq(payrollEmployees.employeeId, employees.id))
      .where(eq(payrollEmployees.payrollRunId, payrollRun.id))
      .execute();

    return NextResponse.json({
      verified: Boolean(payrollRun.batchRoot && payrollRun.proofHash),
      payrollRun: {
        id: payrollRun.id,
        periodStart: payrollRun.periodStart,
        periodEnd: payrollRun.periodEnd,
        totalXlm: payrollRun.totalXlm,
        totalUsdc: payrollRun.totalUsdc,
        payeeCount: payrollRun.payeeCount,
        batchSize: payrollRun.batchSize,
        batchCount: payrollRun.batchCount,
        batchRoot: payrollRun.batchRoot,
        payrollRunHash: payrollRun.payrollRunHash,
        proofHash: payrollRun.proofHash,
        status: payrollRun.status,
        createdAt: payrollRun.createdAt,
      },
      proof: proofResult[0]
        ? {
            proofHash: proofResult[0].proofHash,
            publicInputs: proofResult[0].publicInputs,
            isValid: proofResult[0].isValid,
            generatedAt: proofResult[0].generatedAt,
          }
        : null,
      payees: payrollEmployeeRows.map((row) => ({
        id: row.id,
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        employeeType: row.employeeType,
        amount: row.netSalary,
        currency: row.payoutCurrency,
        status: row.status,
        commitment: row.commitment,
        batchIndex: row.batchIndex,
        payeeIndex: row.payeeIndex,
        txHash: row.txHash,
      })),
    });
  } catch (error) {
    console.error('Error verifying payroll:', error);

    return NextResponse.json(
      {
        error: 'Failed to verify payroll',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
