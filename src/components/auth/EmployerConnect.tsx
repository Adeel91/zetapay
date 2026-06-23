'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowLeft, CheckCircle, Building2, AlertCircle } from 'lucide-react';
import { AUTH, ROUTES } from '@/config';
import { isFreighterAvailable, getFreighterPublicKey } from '@/lib/stellar/freighter';
import { useWallet } from '@/app/providers';

export default function EmployerConnect() {
  const router = useRouter();
  const { refreshUser } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      // 1. Check if the Freighter browser extension is installed
      const available = await isFreighterAvailable();
      if (!available) {
        setError(
          'Freighter wallet is not active or installed. Please install the extension from freighter.app to continue.'
        );
        setIsConnecting(false);
        return;
      }

      // 2. Fetch the public key securely via the Freighter API driver
      const publicKey = await getFreighterPublicKey();
      setWalletAddress(publicKey);

      // 3. Delegate session management and database checks to the server
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey }),
      });

      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok) {
        throw new Error(
          sessionData.error || 'Server rejected wallet authorization session initialization.'
        );
      }

      // 4. Query live on-chain balances to confirm network activation state
      const balanceResponse = await fetch(`/api/stellar/balance?wallet=${publicKey}`);
      const balanceData = await balanceResponse.json();

      if (!balanceResponse.ok) {
        console.warn('Could not read wallet ledger tracks:', balanceData.error);
      } else {
        console.log(
          `Successfully indexed ledger: XLM: ${balanceData.xlm}, USDC: ${balanceData.usdc}`
        );
      }

      // 5. Force client layout context sync right after verification checks succeed
      refreshUser(publicKey);
      setIsConnected(true);

      // 6. Force Next.js router to refresh server data layout nodes before changing routes
      router.refresh();

      // 7. Route cleanly using Next.js framework state engine to prevent layout unmounting wipes
      setTimeout(() => {
        router.push(ROUTES.employer.root);
      }, 800);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      console.error('Connection failed:', err);
      setError(
        errorMessage || 'Failed to authenticate wallet. Please approve the prompt and try again.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <button
          onClick={() => router.push(AUTH)}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Building2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Connect Wallet</h1>
          <p className="mt-2 text-slate-500">
            Connect your Stellar wallet to start running payroll
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {walletAddress && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Connected Wallet</p>
            <p className="font-mono text-sm text-slate-700">
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {isConnected ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
              <p className="mt-2 font-semibold text-emerald-700">Wallet Connected!</p>
              <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    Connect Freighter Wallet
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-slate-400">
                  Supported: Freighter Wallet on Stellar Testnet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  <a
                    href="https://freighter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline"
                  >
                    Install Freighter
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
