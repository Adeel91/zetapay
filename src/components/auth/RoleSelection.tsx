'use client';

import { useRouter } from 'next/navigation';
import { Building2, Shield } from 'lucide-react';
import { ROUTES } from '@/config';

export default function RoleSelection() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Building2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Choose Your Role</h1>
          <p className="mt-2 text-slate-500">Select how you want to proceed with ZetaPay</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push(ROUTES.auth.employerConnect)}
            className="rounded-xl border-2 border-slate-200 p-6 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50/50"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">Employer</h3>
            <p className="mt-1 text-sm text-slate-500">Run payroll, manage employees</p>
            <p className="mt-2 text-xs text-emerald-600">Connect Stellar Wallet</p>
          </button>

          <button
            onClick={() => router.push(ROUTES.auth.auditorLogin)}
            className="rounded-xl border-2 border-slate-200 p-6 text-center transition-all hover:border-indigo-500 hover:bg-indigo-50/50"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">Auditor</h3>
            <p className="mt-1 text-sm text-slate-500">Verify payroll with audit keys</p>
            <p className="mt-2 text-xs text-indigo-600">Login with Email & Audit Key</p>
          </button>
        </div>
      </div>
    </div>
  );
}
