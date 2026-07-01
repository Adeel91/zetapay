import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ShieldedPoolPayrollRequest = {
  action?: 'prepare' | 'submitInitialize' | 'submitSigned';
  walletAddress?: string;
  periodStart?: string;
  periodEnd?: string;
  payrollMode?: 'shielded_pool';
  items?: {
    personId: string;
    amount: string;
    currency: 'XLM' | 'USDC';
  }[];
  payrollRunId?: number;
  signedXdr?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ShieldedPoolPayrollRequest;

  console.log('[zetapay pool] request received', {
    action: body.action || 'prepare',
    walletAddress: body.walletAddress,
    periodStart: body.periodStart,
    periodEnd: body.periodEnd,
    itemCount: body.items?.length || 0,
  });

  return NextResponse.json(
    {
      success: false,
      step: body.action || 'prepare',
      message:
        'Shielded pool payroll endpoint reached. Pool transaction building is not implemented yet.',
    },
    { status: 501 }
  );
}
