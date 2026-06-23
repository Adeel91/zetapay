import { NextResponse } from 'next/server';
import { stellarServer, extractBalance } from '@/lib/stellar/horizon';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing required wallet query parameter' },
        { status: 400 }
      );
    }

    let accountDetails = null;
    try {
      accountDetails = await stellarServer.loadAccount(walletAddress);
    } catch {
      console.error('Target account is empty or unfunded.');
    }

    if (!accountDetails) {
      return NextResponse.json({
        wallet: walletAddress,
        xlm: '0.0000000',
        usdc: '0.0000000',
        isFunded: false,
      });
    }

    const xlmBalance = extractBalance(accountDetails, 'native');
    const usdcBalance = extractBalance(accountDetails, 'USDC');

    return NextResponse.json({
      wallet: walletAddress,
      xlm: xlmBalance,
      usdc: usdcBalance,
      isFunded: true,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Master database query failure';

    console.error('Balance endpoint failure:', error);

    return NextResponse.json(
      { error: errorMessage || 'Failed fetching ledger asset balances' },
      { status: 500 }
    );
  }
}
