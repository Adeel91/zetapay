// app/api/stellar/send/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { 
  payrollRuns, 
  payrollEmployees, 
  employees, 
  enterprises,
  zkProofs,
  transactionLogs 
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      recipient, 
      amount, 
      currency, 
      memo, 
      zkProof,
      employeeId,
      periodStart,
      periodEnd,
    } = body;

    // Validate
    if (!recipient || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment details' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const enterpriseId = cookieStore.get('enterpriseId')?.value;

    if (!enterpriseId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 1. Get employee
    let employee;
    if (employeeId) {
      const result = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.id, parseInt(employeeId)),
            eq(employees.enterpriseId, parseInt(enterpriseId))
          )
        )
        .limit(1)
        .execute();
      employee = result[0];
    } else {
      const result = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.walletAddress, recipient),
            eq(employees.enterpriseId, parseInt(enterpriseId))
          )
        )
        .limit(1)
        .execute();
      employee = result[0];
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // 2. Generate audit key (32 characters max)
    const auditKey = crypto.randomUUID().replace(/-/g, '').slice(0, 32);

    // 3. Generate proof hash (trim to 64 characters)
    let proofHash: string | null = null;
    if (zkProof?.proof) {
      const hash = crypto.createHash('sha256').update(Buffer.from(zkProof.proof)).digest('hex');
      proofHash = '0x' + hash;
      // ✅ Trim to 64 characters max
      if (proofHash.length > 64) {
        proofHash = proofHash.slice(0, 64);
      }
    }

    // 4. Create payroll run
    const [payrollRun] = await db
      .insert(payrollRuns)
      .values({
        enterpriseId: parseInt(enterpriseId),
        runDate: new Date(),
        periodStart: periodStart ? new Date(periodStart) : new Date(),
        periodEnd: periodEnd ? new Date(periodEnd) : new Date(),
        totalGross: amount.toString(),
        totalNet: amount.toString(),
        totalTaxWithheld: '0',
        totalDeductions: '0',
        auditKey: auditKey,
        proofHash: proofHash,
        proofPublicInputs: zkProof?.publicInputs || null,
        status: 'processing',
        processedBy: 'system',
        processedAt: new Date(),
        notes: memo || `Payment to ${employee.fullName}`,
      })
      .returning()
      .execute();

    // 5. Create payroll employee entry
    const [payrollEmployee] = await db
      .insert(payrollEmployees)
      .values({
        payrollRunId: payrollRun.id,
        employeeId: employee.id,
        grossSalary: amount.toString(),
        netSalary: amount.toString(),
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
        status: 'processing',
        txHash: null,
        processedAt: new Date(),
      })
      .returning()
      .execute();

    // 6. Store ZK proof if provided
    let zkProofRecord = null;
    if (zkProof && zkProof.proof) {
      const proofData = Buffer.from(zkProof.proof).toString('base64');
      const [record] = await db
        .insert(zkProofs)
        .values({
          payrollRunId: payrollRun.id,
          proofHash: proofHash || '0x' + crypto.randomUUID().replace(/-/g, '').slice(0, 32),
          proofData: proofData,
          publicInputs: zkProof.publicInputs || [],
          verifyingKeyHash: null,
          isValid: false,
          generatedAt: new Date(),
        })
        .returning()
        .execute();
      zkProofRecord = record;
    }

    // 7. Create transaction log
    const [txLog] = await db
      .insert(transactionLogs)
      .values({
        txHash: 'pending_' + Date.now(),
        enterpriseId: parseInt(enterpriseId),
        payrollRunId: payrollRun.id,
        payrollEmployeeId: payrollEmployee.id,
        fromAddress: 'contract',
        toAddress: recipient,
        amount: amount.toString(),
        currency: currency || 'USDC',
        memo: memo || `Payment to ${employee.fullName}`,
        status: 'pending',
        fee: '0',
      })
      .returning()
      .execute();

    // 8. Update payroll run with tx hash
    await db
      .update(payrollRuns)
      .set({
        status: 'completed',
        processedAt: new Date(),
        txHash: txLog.txHash,
      })
      .where(eq(payrollRuns.id, payrollRun.id))
      .execute();

    // 9. Update payroll employee
    await db
      .update(payrollEmployees)
      .set({
        status: 'completed',
        txHash: txLog.txHash,
        processedAt: new Date(),
      })
      .where(eq(payrollEmployees.id, payrollEmployee.id))
      .execute();

    // 10. Update transaction log
    await db
      .update(transactionLogs)
      .set({
        status: 'completed',
        stellarCreatedAt: new Date(),
      })
      .where(eq(transactionLogs.id, txLog.id))
      .execute();

    return NextResponse.json({
      success: true,
      payrollRunId: payrollRun.id,
      payrollEmployeeId: payrollEmployee.id,
      txHash: txLog.txHash,
      zkProof: {
        id: zkProofRecord?.id,
        hash: proofHash,
        isValid: zkProofRecord?.isValid || false,
      },
      employee: {
        id: employee.id,
        name: employee.fullName,
        wallet: employee.walletAddress,
      },
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Payment failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}