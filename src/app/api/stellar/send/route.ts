import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipient, amount, currency, memo } = body;

    if (!recipient || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment details' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transactionId: `0x${Math.random().toString(36).substring(7)}`,
      recipient,
      amount,
      currency,
      memo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}
