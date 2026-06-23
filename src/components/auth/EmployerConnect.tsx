'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowLeft, CheckCircle, Building2 } from 'lucide-react';
import { AUTH, EMPLOYER, ROUTES } from '@/config';
import { useWallet } from '@/app/providers';
import Cookies from 'js-cookie';

export default function EmployerConnect() {
  const router = useRouter();
  const { connect, isConnecting, isConnected } = useWallet();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConnect = async () => {
    Cookies.set('zetaRole', EMPLOYER, { expires: 7, path: '/' });

    await connect();
    setShowSuccess(true);

    setTimeout(() => {
      router.push(ROUTES.employer.root);
    }, 500);
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

        <div className="mt-8 space-y-4">
          {isConnected || showSuccess ? (
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

              <p className="text-center text-xs text-slate-400">
                Supported: Freighter Wallet on Stellar
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
