import { NextResponse } from 'next/server';
import { stellarServer, extractBalance } from '@/lib/stellar/horizon';

/**
 * GET Handler: Fetches real-time on-chain balances from the Stellar network
 * Endpoint: /api/stellar/balance?wallet=G...
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    // 1. Validate request payload
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing required wallet query parameter' },
        { status: 400 }
      );
    }

    // 2. Fetch direct live ledger details from Horizon Testnet client instance
    let accountDetails = null;
    try {
      accountDetails = await stellarServer.loadAccount(walletAddress);
    } catch {
      console.log('Target account is empty or unfunded.');
    }

    // 3. Handle un-funded or brand new Stellar accounts gracefully
    if (!accountDetails) {
      return NextResponse.json({
        wallet: walletAddress,
        xlm: '0.0000000',
        usdc: '0.0000000',
        isFunded: false,
      });
    }

    // 4. Extract native asset types using structural helper utilities
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
