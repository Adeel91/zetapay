'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, FileWarning, ShieldCheck, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';

type VerificationResponse = {
  verified: boolean;
  payrollRun: {
    periodStart: string;
    periodEnd: string;
    totalXlm: string;
    totalUsdc: string;
    payeeCount: number;
    batchSize: number;
    batchCount: number;
    batchRoot: string;
    payrollRunHash: string;
    proofHash: string;
    status: string;
    createdAt: string;
  };
  proof: {
    proofHash: string;
    publicInputs: unknown;
    isValid: boolean;
    generatedAt: string;
  } | null;
  payees: {
    id: number;
    employeeName: string | null;
    employeeType: string | null;
    amount: string;
    currency: string;
    status: string;
    commitment: string | null;
    batchIndex: number | null;
    payeeIndex: number | null;
    txHash: string | null;
  }[];
};

export default function PayrollVerificationPage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVerification() {
      try {
        const response = await fetch(`/api/payroll/verify/${params.token}`);

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error || 'Verification failed');
        }

        const body = await response.json();
        setData(body);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    }

    void loadVerification();
  }, [params.token]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto flex max-w-5xl justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileWarning className="mx-auto h-10 w-10 text-amber-600" />

          <h1 className="mt-4 text-2xl font-bold text-slate-900">Verification failed</h1>

          <p className="mt-2 text-sm text-slate-500">{error || 'Invalid verification link'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-slate-200/50">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-8 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm text-emerald-50">
              <ShieldCheck className="h-4 w-4" />
              ZetaPay Payroll Verification
            </div>

            <h1 className="mt-4 text-3xl font-bold">Payroll proof record</h1>

            <p className="mt-2 max-w-2xl text-sm text-emerald-50/80">
              This page verifies that the payroll batch was generated and committed with a Merkle
              root and proof hash.
            </p>
          </div>

          <CardContent className="grid gap-4 p-6 md:grid-cols-4">
            <Metric label="Status" value={data.verified ? 'Verified record' : 'Incomplete'} />
            <Metric label="Payees" value={`${data.payrollRun.payeeCount}`} />
            <Metric label="Total XLM" value={`${data.payrollRun.totalXlm} XLM`} />
            <Metric label="Total USDC" value={`${data.payrollRun.totalUsdc} USDC`} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Proof details</h2>

              <div className="mt-5 space-y-4">
                <HashRow label="Batch root" value={data.payrollRun.batchRoot} />
                <HashRow label="Payroll run hash" value={data.payrollRun.payrollRunHash} />
                <HashRow label="Proof hash" value={data.payrollRun.proofHash} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">Integrity checks</h2>
              </div>

              <div className="mt-5 space-y-3">
                <Check label="Payroll record found" />
                <Check label="Merkle root present" />
                <Check label="Proof hash present" />
                <Check label="Payee commitments stored" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />

              <h2 className="text-lg font-semibold text-slate-900">Committed payees</h2>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {data.payees.map((payee) => (
                <div
                  key={payee.id}
                  className="grid gap-4 py-4 md:grid-cols-[1fr_160px_120px] md:items-center"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {payee.employeeName || 'Private payee'}
                    </p>

                    <p className="mt-1 truncate font-mono text-xs text-slate-400">
                      Commitment: {payee.commitment}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {payee.amount} {payee.currency}
                  </p>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-center text-xs font-medium text-emerald-700">
                    {payee.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
      <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</p>
      <p className="mt-1 rounded-2xl bg-slate-50 p-3 font-mono text-xs break-all text-slate-700">
        {value}
      </p>
    </div>
  );
}

function Check({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
      <CheckCircle2 className="h-4 w-4" />
      {label}
    </div>
  );
}
