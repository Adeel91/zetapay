'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CheckCircle2, FileCheck2, KeyRound, ShieldCheck, Wallet, XCircle } from 'lucide-react';

type VerifyResponse = {
  verified: boolean;
  reason: string | null;
  commitment: string | null;
  merkleRoot: string | null;
  expectedRoot: string;
  rootMatchesFixture: boolean;
  siblings: string[];
  pathIndices: number[];
  error?: string;
};

const magicLinkSessions: Record<
  string,
  {
    payeeIndex: number;
    name: string;
    email: string;
    role: string;
    token: string;
    amount: string;
    wallet: string;
    period: string;
    company: string;
  }
> = {
  'amina-demo-token': {
    payeeIndex: 0,
    name: 'Amina Khan',
    email: 'amina@zetapay.demo',
    role: 'Employee',
    token: 'XLM',
    amount: '5,000',
    wallet: 'GAMINA...XLM',
    period: 'January 2026',
    company: 'ZetaPay Demo Company',
  },
};

export default function EmployeePayrollPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? 'amina-demo-token';

  const session = useMemo(() => magicLinkSessions[token], [token]);

  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function verifyPayroll() {
    if (!session) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/payroll/verify-payee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payeeIndex: session.payeeIndex,
        }),
      });

      const data = (await response.json()) as VerifyResponse;
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
          <XCircle className="h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Invalid payroll link</h1>
          <p className="mt-2 text-slate-600">This magic link is expired or not recognized.</p>
        </div>
      </main>
    );
  }

  const fullyVerified = result?.verified === true && result.rootMatchesFixture === true;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                  <KeyRound className="h-4 w-4" />
                  Magic link employee access
                </div>

                <h1 className="mt-5 text-3xl font-semibold">Private payroll verification</h1>

                <p className="mt-3 max-w-2xl text-slate-300">
                  Verify that your payroll record is included in a proven payroll batch without
                  seeing anyone else's salary.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 text-sm">
                <p className="text-slate-300">Signed in as</p>
                <p className="mt-1 font-medium">{session.email}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-3">
            <InfoCard label="Payee" value={session.name} />
            <InfoCard label="Company" value={session.company} />
            <InfoCard label="Payroll period" value={session.period} />
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Payroll details</h2>

            <div className="mt-6 space-y-4">
              <DetailRow label="Payee type" value={session.role} />
              <DetailRow label="Amount" value={`${session.amount} ${session.token}`} />
              <DetailRow label="Recipient wallet" value={session.wallet} />
              <DetailRow label="Batch size" value="128 payees" />
            </div>

            <button
              onClick={verifyPayroll}
              disabled={loading}
              className="mt-8 w-full rounded-2xl bg-slate-950 px-5 py-4 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Verifying payroll...' : 'Verify my payroll'}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Zero knowledge verification</h2>

              {fullyVerified ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  Pending
                </span>
              )}
            </div>

            {!result && (
              <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-slate-600">
                Click verify to recompute your payroll commitment, validate the Merkle path, and
                compare the result with the verified payroll batch root.
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-4">
                <StatusRow
                  icon={<FileCheck2 className="h-5 w-5" />}
                  label="Payroll commitment"
                  value={result.verified}
                />

                <StatusRow
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label="Merkle inclusion proof"
                  value={result.verified}
                />

                <StatusRow
                  icon={<Wallet className="h-5 w-5" />}
                  label="Batch root match"
                  value={result.rootMatchesFixture}
                />

                <div className="mt-6 grid gap-4">
                  <HashBlock title="Commitment" value={result.commitment} />
                  <HashBlock title="Merkle root" value={result.merkleRoot} />
                  <HashBlock title="Expected root" value={result.expectedRoot} />
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">Merkle proof depth</p>
                  <p className="mt-1 text-sm text-slate-600">{result.siblings.length} levels</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 p-6 md:border-r md:border-b-0">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-3 text-slate-700">
        {icon}
        <span>{label}</span>
      </div>

      <span className={value ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
        {value ? 'Verified' : 'Failed'}
      </span>
    </div>
  );
}

function HashBlock({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-2 text-xs leading-5 break-all text-slate-500">{value ?? 'Not available'}</p>
    </div>
  );
}
