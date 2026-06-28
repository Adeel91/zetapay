import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  employees,
  payrollEmployees,
  payrollRuns,
  payrollVerificationLinks,
  zkProofs,
} from '@/lib/db/schema';

type EmployeeSelect = typeof employees.$inferSelect;

function getBaseUrl(request: Request) {
  const origin = request.headers.get('origin');

  if (origin) return origin;

  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';

  return host ? `${protocol}://${host}` : '';
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const enterpriseIdStr = cookieStore.get('enterpriseId')?.value;

    if (!enterpriseIdStr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payrollRunId = parseInt(id, 10);
    const enterpriseId = parseInt(enterpriseIdStr, 10);

    if (Number.isNaN(payrollRunId)) {
      return NextResponse.json({ error: 'Invalid payroll run id' }, { status: 400 });
    }

    const payrollResult = await db
      .select()
      .from(payrollRuns)
      .where(and(eq(payrollRuns.id, payrollRunId), eq(payrollRuns.enterpriseId, enterpriseId)))
      .limit(1)
      .execute();

    const payrollRun = payrollResult[0];

    if (!payrollRun) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    const payrollEmployeeRows = await db
      .select()
      .from(payrollEmployees)
      .where(eq(payrollEmployees.payrollRunId, payrollRunId))
      .execute();

    let employeeDetails: EmployeeSelect[] = [];

    if (payrollEmployeeRows.length > 0) {
      const employeeIds = payrollEmployeeRows.map((payee) => payee.employeeId);

      employeeDetails = await db
        .select()
        .from(employees)
        .where(inArray(employees.id, employeeIds))
        .execute();
    }

    const proofRows = await db
      .select()
      .from(zkProofs)
      .where(eq(zkProofs.payrollRunId, payrollRunId))
      .limit(1)
      .execute();

    const linkRows = await db
      .select()
      .from(payrollVerificationLinks)
      .where(eq(payrollVerificationLinks.payrollRunId, payrollRunId))
      .execute();

    const baseUrl = getBaseUrl(request);

    return NextResponse.json({
      ...payrollRun,
      publicVerificationUrl: payrollRun.publicVerificationToken
        ? `${baseUrl}/verify/payroll/${payrollRun.publicVerificationToken}`
        : null,
      proof: proofRows[0] || null,
      employees: payrollEmployeeRows.map((payee) => {
        const employee = employeeDetails.find((item) => item.id === payee.employeeId);
        const verificationLink = linkRows.find((link) => link.payrollEmployeeId === payee.id);

        return {
          ...payee,
          employee,
          employeeVerificationLink: verificationLink
            ? {
                id: verificationLink.id,
                linkType: verificationLink.linkType,
                expiresAt: verificationLink.expiresAt,
                usedAt: verificationLink.usedAt,
                revokedAt: verificationLink.revokedAt,
                verificationUrl: verificationLink.token
                  ? `${baseUrl}/verify/payment/${verificationLink.token}`
                  : null,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching payroll run:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch payroll run',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const enterpriseIdStr = cookieStore.get('enterpriseId')?.value;

    if (!enterpriseIdStr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payrollRunId = parseInt(id, 10);
    const enterpriseId = parseInt(enterpriseIdStr, 10);
    const body = await request.json();
    const { status, txHash } = body;

    const existingRows = await db
      .select()
      .from(payrollRuns)
      .where(and(eq(payrollRuns.id, payrollRunId), eq(payrollRuns.enterpriseId, enterpriseId)))
      .limit(1)
      .execute();

    const existing = existingRows[0];

    if (!existing) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    const [updated] = await db
      .update(payrollRuns)
      .set({
        status: status || existing.status,
        txHash: txHash || existing.txHash,
        updatedAt: new Date(),
      })
      .where(eq(payrollRuns.id, payrollRunId))
      .returning()
      .execute();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating payroll run:', error);
    return NextResponse.json({ error: 'Failed to update payroll run' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const enterpriseIdStr = cookieStore.get('enterpriseId')?.value;

    if (!enterpriseIdStr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payrollRunId = parseInt(id, 10);
    const enterpriseId = parseInt(enterpriseIdStr, 10);

    const existingRows = await db
      .select()
      .from(payrollRuns)
      .where(and(eq(payrollRuns.id, payrollRunId), eq(payrollRuns.enterpriseId, enterpriseId)))
      .limit(1)
      .execute();

    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    await db.delete(payrollRuns).where(eq(payrollRuns.id, payrollRunId)).execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payroll run:', error);
    return NextResponse.json({ error: 'Failed to delete payroll run' }, { status: 500 });
  }
}
