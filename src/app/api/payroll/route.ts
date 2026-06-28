import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  employees,
  payrollEmployees,
  payrollRuns,
  payrollVerificationLinks,
  zkProofs,
} from '@/lib/db/schema';
import {
  buildPayrollBatch,
  BATCH_SIZE,
  PayrollBatchInputItem,
  sha256Hex,
} from '@/lib/zk/payroll-batch';

type PayrollCreateRequest = {
  periodStart: string;
  periodEnd: string;
  items: PayrollBatchInputItem[];
};

const EMPLOYEE_LINK_EXPIRY_DAYS = 30;

function randomHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function getBaseUrl(request: Request) {
  const origin = request.headers.get('origin');

  if (origin) return origin;

  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';

  return host ? `${protocol}://${host}` : '';
}

function getEmployeeLinkExpiry() {
  return new Date(Date.now() + EMPLOYEE_LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get('enterpriseId');

    if (!enterpriseId) {
      return NextResponse.json({ error: 'Enterprise ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionEnterpriseId = cookieStore.get('enterpriseId')?.value;

    if (!sessionEnterpriseId || parseInt(sessionEnterpriseId, 10) !== parseInt(enterpriseId, 10)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const records = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.enterpriseId, parseInt(enterpriseId, 10)))
      .orderBy(desc(payrollRuns.createdAt))
      .execute();

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll runs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const enterpriseIdStr = cookieStore.get('enterpriseId')?.value;

    if (!enterpriseIdStr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enterpriseId = parseInt(enterpriseIdStr, 10);
    const body = (await request.json()) as PayrollCreateRequest;

    if (!body.periodStart || !body.periodEnd) {
      return NextResponse.json({ error: 'Payroll period is required' }, { status: 400 });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one payee is required' }, { status: 400 });
    }

    if (body.items.length > BATCH_SIZE) {
      return NextResponse.json(
        {
          error: `This demo endpoint currently supports ${BATCH_SIZE} payees. Multi batch generation comes next.`,
        },
        { status: 400 }
      );
    }

    const employeeIds = body.items.map((item) => parseInt(item.personId, 10));

    if (employeeIds.some((id) => Number.isNaN(id))) {
      return NextResponse.json({ error: 'Invalid payee id' }, { status: 400 });
    }

    const employeeRows = await db
      .select()
      .from(employees)
      .where(and(inArray(employees.id, employeeIds), eq(employees.enterpriseId, enterpriseId)))
      .execute();

    if (employeeRows.length !== employeeIds.length) {
      return NextResponse.json(
        { error: 'One or more payees do not belong to this enterprise' },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(request);
    const auditKey = randomHex(16);
    const publicVerificationToken = randomHex(32);
    const publicVerificationTokenHash = sha256Hex(publicVerificationToken);

    const batch = buildPayrollBatch({
      enterpriseId,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      auditKey,
      items: body.items,
      employees: employeeRows.map((employee) => ({
        id: employee.id,
        walletAddress: employee.walletAddress,
      })),
    });

    const [payrollRun] = await db
      .insert(payrollRuns)
      .values({
        enterpriseId,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        totalGross: batch.totals.totalGross.toString(),
        totalNet: batch.totals.totalGross.toString(),
        totalTaxWithheld: '0',
        totalDeductions: '0',
        totalXlm: batch.totals.totalXlm.toString(),
        totalUsdc: batch.totals.totalUsdc.toString(),
        payeeCount: batch.rows.length,
        batchSize: batch.batchSize,
        batchCount: batch.batchCount,
        batchRoot: batch.batchRoot,
        payrollRunHash: batch.payrollRunHash,
        auditKey,
        publicVerificationTokenHash,
        publicVerificationToken,
        publicVerificationTokenCreatedAt: new Date(),
        proofHash: batch.proofHash,
        proofPublicInputs: batch.proofPublicInputs,
        status: 'processing',
        processedBy: 'system',
        processedAt: new Date(),
        runDate: new Date(),
        metadata: {
          generatedBy: 'payroll-review',
          proofMode: 'db-merkle-placeholder',
          note: 'Groth16 proof generation will replace this placeholder next.',
        },
      })
      .returning()
      .execute();

    const employeeVerificationLinks: {
      employeeId: number;
      payrollEmployeeId: number;
      verificationUrl: string;
      token: string;
      expiresAt: string;
    }[] = [];

    for (const row of batch.rows) {
      const [payrollEmployee] = await db
        .insert(payrollEmployees)
        .values({
          payrollRunId: payrollRun.id,
          employeeId: row.employee.id,
          payoutCurrency: row.item.currency,
          grossSalary: row.item.amount,
          netSalary: row.item.amount,
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
          payeeIndex: row.index,
          salt: row.salt,
          commitment: row.commitment,
          merklePath: row.merklePath,
          pathIndices: row.pathIndices,
          status: 'processing',
          processedAt: new Date(),
        })
        .returning()
        .execute();

      const employeeVerificationToken = randomHex(32);
      const employeeVerificationTokenHash = sha256Hex(employeeVerificationToken);
      const expiresAt = getEmployeeLinkExpiry();

      await db
        .insert(payrollVerificationLinks)
        .values({
          tokenHash: employeeVerificationTokenHash,
          token: employeeVerificationToken,
          linkType: 'employee',
          enterpriseId,
          employeeId: row.employee.id,
          payrollRunId: payrollRun.id,
          payrollEmployeeId: payrollEmployee.id,
          expiresAt,
        })
        .execute();

      employeeVerificationLinks.push({
        employeeId: row.employee.id,
        payrollEmployeeId: payrollEmployee.id,
        verificationUrl: `${baseUrl}/verify/payment/${employeeVerificationToken}`,
        token: employeeVerificationToken,
        expiresAt: expiresAt.toISOString(),
      });
    }

    await db
      .insert(zkProofs)
      .values({
        payrollRunId: payrollRun.id,
        proofHash: batch.proofHash,
        proofData: Buffer.from(JSON.stringify(batch.proofData)).toString('base64'),
        publicInputs: batch.proofPublicInputs,
        verifyingKeyHash: null,
        isValid: false,
        generatedAt: new Date(),
      })
      .execute();

    return NextResponse.json(
      {
        success: true,
        payrollRunId: payrollRun.id,
        status: payrollRun.status,
        batchRoot: batch.batchRoot,
        payrollRunHash: batch.payrollRunHash,
        proofHash: batch.proofHash,
        publicVerificationUrl: `${baseUrl}/verify/payroll/${publicVerificationToken}`,
        publicVerificationToken,
        employeeVerificationLinks,
        employerPayrollUrl: `${baseUrl}/dashboard/employer/payroll/${payrollRun.id}`,
        totals: {
          xlm: batch.totals.totalXlm,
          usdc: batch.totals.totalUsdc,
          payeeCount: batch.rows.length,
          batchCount: batch.batchCount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating ZK payroll:', error);

    return NextResponse.json(
      {
        error: 'Failed to create ZK payroll',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
