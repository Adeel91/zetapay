import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { payrollRuns, payrollEmployees, employees } from '@/lib/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get('enterpriseId');

    if (!enterpriseId) {
      return NextResponse.json({ error: 'Enterprise ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionEnterpriseId = cookieStore.get('enterpriseId')?.value;

    if (!sessionEnterpriseId || parseInt(sessionEnterpriseId) !== parseInt(enterpriseId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const records = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.enterpriseId, parseInt(enterpriseId)))
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

    const body = await request.json();
    const { employeeIds, periodStart, periodEnd } = body;

    if (!employeeIds || employeeIds.length === 0) {
      return NextResponse.json({ error: 'At least one employee is required' }, { status: 400 });
    }

    const enterpriseId = parseInt(enterpriseIdStr);

    const employeeRecords = await db
      .select()
      .from(employees)
      .where(
        inArray(
          employees.id,
          employeeIds.map((id: string) => parseInt(id))
        )
      )
      .execute();

    let totalGross = 0;
    let totalNet = 0;
    let totalTax = 0;

    const payrollEntries = employeeRecords.map((emp) => {
      let gross = 0;
      if (emp.salary !== null && emp.salary !== undefined) {
        gross = typeof emp.salary === 'string' ? parseFloat(emp.salary) : Number(emp.salary);
      }

      const tax = gross * 0.2;
      const net = gross - tax;

      totalGross += gross;
      totalNet += net;
      totalTax += tax;

      return {
        employeeId: emp.id,
        grossSalary: gross,
        netSalary: net,
        taxWithheld: tax,
        federalTax: tax * 0.5,
        stateTax: tax * 0.3,
        localTax: tax * 0.1,
        socialSecurity: gross * 0.062,
        medicare: gross * 0.0145,
        deductions: 0,
        bonuses: 0,
        commissions: 0,
        reimbursements: 0,
        status: 'pending' as const,
      };
    });

    const auditKey = randomUUID().replace(/-/g, '').slice(0, 32);

    const result = await db
      .insert(payrollRuns)
      .values({
        enterpriseId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        totalGross: totalGross.toString(),
        totalNet: totalNet.toString(),
        totalTaxWithheld: totalTax.toString(),
        totalDeductions: '0',
        auditKey,
        status: 'completed',
        processedBy: 'system',
        processedAt: new Date(),
        txHash: `0x${randomUUID().replace(/-/g, '')}`,
        runDate: new Date(),
      })
      .returning()
      .execute();

    const payrollRun = result[0];

    for (const entry of payrollEntries) {
      await db
        .insert(payrollEmployees)
        .values({
          payrollRunId: payrollRun.id,
          employeeId: entry.employeeId,
          grossSalary: entry.grossSalary.toString(),
          netSalary: entry.netSalary.toString(),
          taxWithheld: entry.taxWithheld.toString(),
          federalTax: entry.federalTax.toString(),
          stateTax: entry.stateTax.toString(),
          localTax: entry.localTax.toString(),
          socialSecurity: entry.socialSecurity.toString(),
          medicare: entry.medicare.toString(),
          deductions: entry.deductions.toString(),
          bonuses: entry.bonuses.toString(),
          commissions: entry.commissions.toString(),
          reimbursements: entry.reimbursements.toString(),
          status: 'pending',
          processedAt: new Date(),
        })
        .execute();
    }

    return NextResponse.json(payrollRun, { status: 201 });
  } catch (error) {
    console.error('Error creating payroll:', error);
    return NextResponse.json({ error: 'Failed to create payroll' }, { status: 500 });
  }
}
