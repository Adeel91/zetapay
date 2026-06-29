import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  auditLogs,
  employees,
  enterprises,
  payrollEmployees,
  payrollRuns,
  users,
  zkProofs,
} from '@/lib/db/schema';

type AuditVerifyRequest = {
  auditKey?: string;
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

    const [payrollRunFromKey] = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.auditKey, cleanAuditKey))
      .limit(1)
      .execute();

    if (!payrollRunFromKey) {
      return NextResponse.json({ error: 'Invalid audit key' }, { status: 403 });
    }

    const [payroll] = await db
      .select({
        payrollRun: payrollRuns,
        enterprise: enterprises,
      })
      .from(payrollRuns)
      .innerJoin(enterprises, eq(enterprises.id, payrollRuns.enterpriseId))
      .where(eq(payrollRuns.id, payrollRunFromKey.id))
      .limit(1)
      .execute();

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    const payeeRows = await db
      .select({
        payrollEmployee: payrollEmployees,
        employee: employees,
      })
      .from(payrollEmployees)
      .innerJoin(employees, eq(employees.id, payrollEmployees.employeeId))
      .where(eq(payrollEmployees.payrollRunId, payroll.payrollRun.id))
      .execute();

    const [proof] = await db
      .select()
      .from(zkProofs)
      .where(eq(zkProofs.payrollRunId, payroll.payrollRun.id))
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
        payrollRunId: payroll.payrollRun.id,
        enterpriseId: payroll.payrollRun.enterpriseId,
        action: 'view_payroll',
        status: 'verified',
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          auditorEmail,
          companyName: payroll.enterprise.companyName,
          payrollRunId: payroll.payrollRun.id,
          source: 'auditor-dashboard',
        },
      })
      .execute();

    const report = {
      payrollRunId: payroll.payrollRun.id,
      companyName: payroll.enterprise.companyName,
      periodStart: payroll.payrollRun.periodStart,
      periodEnd: payroll.payrollRun.periodEnd,
      totalXlm: payroll.payrollRun.totalXlm,
      totalUsdc: payroll.payrollRun.totalUsdc,
      totalGross: payroll.payrollRun.totalGross,
      totalNet: payroll.payrollRun.totalNet,
      totalTaxWithheld: payroll.payrollRun.totalTaxWithheld,
      payeeCount: payroll.payrollRun.payeeCount || payeeRows.length,
      batchSize: payroll.payrollRun.batchSize,
      batchCount: payroll.payrollRun.batchCount,
      batchRoot: payroll.payrollRun.batchRoot,
      payrollRunHash: payroll.payrollRun.payrollRunHash,
      proofHash: payroll.payrollRun.proofHash,
      status: payroll.payrollRun.status,
      verifiedAt: now.toISOString(),
      proof: proof || null,
      payees: payeeRows.map(({ payrollEmployee, employee }) => ({
        id: payrollEmployee.id,
        employeeId: employee.id,
        employeeName: employee.fullName,
        employeeEmail: employee.email,
        employeeWallet: employee.walletAddress,
        employeeType: employee.type,
        amount: payrollEmployee.netSalary,
        currency: payrollEmployee.payoutCurrency || employee.preferredCurrency || 'USDC',
        status: payrollEmployee.status,
        commitment: payrollEmployee.commitment,
        merklePath: payrollEmployee.merklePath,
        pathIndices: payrollEmployee.pathIndices,
        txHash: payrollEmployee.txHash,
        batchIndex: payrollEmployee.batchIndex,
        payeeIndex: payrollEmployee.payeeIndex,
      })),
    };

    return NextResponse.json({
      success: true,
      payrollRunId: payroll.payrollRun.id,
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
