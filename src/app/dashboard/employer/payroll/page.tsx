'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { CalendarDays, Plus, ShieldCheck, Users } from 'lucide-react';

import { API, ROUTES } from '@/config';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

type PayrollRun = {
  id: number;
  periodStart: string;
  periodEnd: string;
  totalXlm: string;
  totalUsdc: string;
  payeeCount: number;
  batchCount: number;
  batchRoot: string | null;
  proofHash: string | null;
  status: string;
  createdAt: string;
};

export default function EmployerPayrollPage() {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayrollRuns() {
      try {
        const enterpriseId = Cookies.get('enterpriseId');

        if (!enterpriseId) {
          setError('Enterprise session not found');
          setPayrollRuns([]);
          return;
        }

        const response = await fetch(API.payroll.list(enterpriseId));

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error || 'Failed to load payroll runs');
        }

        setPayrollRuns(Array.isArray(body) ? body : []);
      } catch (loadError) {
        setPayrollRuns([]);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load payroll runs');
      } finally {
        setLoading(false);
      }
    }

    void loadPayrollRuns();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Create, review, and verify private payroll runs."
        action={
          <Link href={ROUTES.employer.payrollNew}>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Payroll
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {payrollRuns.length === 0 ? (
        <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
          <CardContent className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck className="h-7 w-7 text-emerald-600" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">No payroll runs yet</h2>

            <p className="mt-2 text-sm text-slate-500">
              Create your first private payroll run and generate proof material.
            </p>

            <Link href={ROUTES.employer.payrollNew}>
              <Button className="mt-6 bg-emerald-600 text-white hover:bg-emerald-700">
                Create Payroll
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payrollRuns.map((run) => (
            <Link key={run.id} href={ROUTES.employer.payrollDetails(String(run.id))}>
              <Card className="border-0 bg-white shadow-xl shadow-slate-200/50 transition hover:shadow-emerald-500/10">
                <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_160px_160px_140px] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">Payroll #{run.id}</h3>

                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {run.status}
                      </span>

                      {run.proofHash && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          Proof saved
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(run.periodStart).toLocaleDateString()} to{' '}
                        {new Date(run.periodEnd).toLocaleDateString()}
                      </span>

                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {run.payeeCount || 0} payees
                      </span>
                    </div>
                  </div>

                  <Metric label="XLM" value={`${run.totalXlm || '0'} XLM`} />
                  <Metric label="USDC" value={`${run.totalUsdc || '0'} USDC`} />
                  <Metric label="Batches" value={`${run.batchCount || 1}`} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
