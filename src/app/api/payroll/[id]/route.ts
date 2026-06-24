import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { payrollRuns, payrollEmployees, employees } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

type EmployeeSelect = typeof employees.$inferSelect;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const enterpriseIdStr = cookieStore.get('enterpriseId')?.value;

    if (!enterpriseIdStr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enterpriseId = parseInt(enterpriseIdStr);

    const payrollResult = await db
      .select()
      .from(payrollRuns)
      .where(and(eq(payrollRuns.id, parseInt(id)), eq(payrollRuns.enterpriseId, enterpriseId)))
      .execute();

    if (!payrollResult || payrollResult.length === 0) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    const payrollEmployeesResult = await db
      .select()
      .from(payrollEmployees)
      .where(eq(payrollEmployees.payrollRunId, parseInt(id)))
      .execute();

    let employeeDetails: EmployeeSelect[] = [];
    if (payrollEmployeesResult.length > 0) {
      const employeeIds = payrollEmployeesResult.map((pe) => pe.employeeId);
      employeeDetails = await db
        .select()
        .from(employees)
        .where(inArray(employees.id, employeeIds))
        .execute();
    }

    const result = {
      ...payrollResult[0],
      employees: payrollEmployeesResult.map((pe) => ({
        ...pe,
        employee: employeeDetails.find((e) => e.id === pe.employeeId),
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching payroll run:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll run' }, { status: 500 });
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

    const body = await request.json();
    const { status, txHash } = body;

    const enterpriseId = parseInt(enterpriseIdStr);

    const existing = await db
      .select()
      .from(payrollRuns)
      .where(and(eq(payrollRuns.id, parseInt(id)), eq(payrollRuns.enterpriseId, enterpriseId)))
      .execute();

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    const result = await db
      .update(payrollRuns)
      .set({
        status: status || existing[0].status,
        txHash: txHash || existing[0].txHash,
        updatedAt: new Date(),
      })
      .where(eq(payrollRuns.id, parseInt(id)))
      .returning()
      .execute();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating payroll run:', error);
    return NextResponse.json({ error: 'Failed to update payroll run' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const enterpriseIdStr = cookieStore.get('enterpriseId')?.value;

    if (!enterpriseIdStr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enterpriseId = parseInt(enterpriseIdStr);

    const existing = await db
      .select()
      .from(payrollRuns)
      .where(and(eq(payrollRuns.id, parseInt(id)), eq(payrollRuns.enterpriseId, enterpriseId)))
      .execute();

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    await db
      .delete(payrollEmployees)
      .where(eq(payrollEmployees.payrollRunId, parseInt(id)))
      .execute();

    await db
      .delete(payrollRuns)
      .where(eq(payrollRuns.id, parseInt(id)))
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payroll run:', error);
    return NextResponse.json({ error: 'Failed to delete payroll run' }, { status: 500 });
  }
}
