'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Shield, ArrowRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config';
import { useWallet } from '../providers';

export default function RoleSelection() {
  const router = useRouter();
  const { walletAddress } = useWallet();
  const [selectedRole, setSelectedRole] = useState<'employer' | 'auditor' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    localStorage.setItem('zetaRole', selectedRole);

    if (selectedRole === 'employer') {
      router.push(ROUTES.employer.root);
    } else {
      router.push(ROUTES.auditor.root);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Wallet className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome to ZetaPay</h1>
          <p className="mt-2 text-slate-500">Choose your role to get started</p>
          <p className="mt-1 font-mono text-xs text-slate-400">{walletAddress || 'G...abcd1234'}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setSelectedRole('employer')}
            className={`rounded-xl border-2 p-6 text-center transition-all ${
              selectedRole === 'employer'
                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-200'
            }`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">Employer</h3>
            <p className="mt-1 text-sm text-slate-500">
              Run payroll, manage employees, generate audit keys
            </p>
          </button>

          <button
            onClick={() => setSelectedRole('auditor')}
            className={`rounded-xl border-2 p-6 text-center transition-all ${
              selectedRole === 'auditor'
                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-indigo-200'
            }`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">Auditor</h3>
            <p className="mt-1 text-sm text-slate-500">
              Verify payroll with audit keys, view decrypted data
            </p>
          </button>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            loading={isLoading}
            className="w-full"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            {selectedRole
              ? `Continue as ${selectedRole === 'employer' ? 'Employer' : 'Auditor'}`
              : 'Select a role to continue'}
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Your role will be saved to your wallet address
        </p>
      </div>
    </div>
  );
}
