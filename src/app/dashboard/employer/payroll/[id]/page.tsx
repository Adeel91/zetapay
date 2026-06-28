'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CalendarDays, CheckCircle2, Copy, FileWarning, ShieldCheck, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROUTES } from '@/config';

type PayrollEmployeeRecord = {
  id: number;
  payrollRunId: number;
  employeeId: number;
  payoutCurrency: string | null;
  grossSalary: string;
  netSalary: string;
  taxWithheld: string;
  status: string | null;
  txHash: string | null;
  batchIndex: number | null;
  payeeIndex: number | null;
  salt: string | null;
  commitment: string | null;
  merklePath: string[] | null;
  pathIndices: number[] | null;
  employee?: {
    id: number;
    fullName: string;
    email: string | null;
    walletAddress: string;
    type: string | null;
    title: string | null;
  };
};

type PayrollRunDetail = {
  id: number;
  enterpriseId: number;
  periodStart: string;
  periodEnd: string;
  totalGross: string;
  totalNet: string;
  totalTaxWithheld: string;
  totalXlm: string;
  totalUsdc: string;
  payeeCount: number | null;
  batchSize: number | null;
  batchCount: number | null;
  batchRoot: string | null;
  payrollRunHash: string | null;
  proofHash: string | null;
  status: string | null;
  createdAt: string;
  employees: PayrollEmployeeRecord[];
};

export default function EmployerPayrollDetailPage() {
  const params = useParams<{ id: string }>();

  const [data, setData] = useState<PayrollRunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function copy(text?: string | null) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  }

  useEffect(() => {
    async function loadPayrollRun() {
      try {
        const response = await fetch(`/api/payroll/${params.id}`);

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error || 'Failed to load payroll run');
        }

        const body = (await response.json()) as PayrollRunDetail;
        setData(body);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load payroll run');
      } finally {
        setLoading(false);
      }
    }

    void loadPayrollRun();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileWarning className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Payroll not found</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'Unable to load payroll run'}</p>
        </div>
      </div>
    );
  }

  const verified = Boolean(data.batchRoot && data.proofHash);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Payroll #${data.id}`}
        description="Employer payroll report with payees, commitments, proof metadata, and status."
        backLink={{ href: ROUTES.employer.payroll, label: 'Back to Payroll' }}
      />

      <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-slate-200/50">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-8 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm text-emerald-50">
            <ShieldCheck className="h-4 w-4" />
            Private employer payroll report
          </div>

          <h1 className="mt-4 text-3xl font-bold">Payroll proof record</h1>

          <p className="mt-2 max-w-2xl text-sm text-emerald-50/80">
            This dashboard view is private to the employer and can show full payroll details.
          </p>
        </div>

        <CardContent className="mt-10 grid gap-4 p-6 md:grid-cols-4">
          <Metric label="Status" value={verified ? 'Proof material saved' : 'Incomplete'} />
          <Metric label="Payees" value={`${data.payeeCount || data.employees.length}`} />
          <Metric label="Total XLM" value={`${data.totalXlm || '0'} XLM`} />
          <Metric label="Total USDC" value={`${data.totalUsdc || '0'} USDC`} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Proof details</h2>

            <div className="mt-5 space-y-4">
              <HashRow label="Batch root" value={data.batchRoot} onCopy={copy} />
              <HashRow label="Payroll run hash" value={data.payrollRunHash} onCopy={copy} />
              <HashRow label="Proof hash" value={data.proofHash} onCopy={copy} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Payroll summary</h2>
            </div>

            <div className="mt-5 space-y-3">
              <SummaryRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Period"
                value={`${new Date(data.periodStart).toLocaleDateString()} to ${new Date(
                  data.periodEnd
                ).toLocaleDateString()}`}
              />
              <SummaryRow
                icon={<Users className="h-4 w-4" />}
                label="Payees"
                value={`${data.employees.length}`}
              />
              <SummaryRow label="Batch count" value={`${data.batchCount || 1}`} />
              <SummaryRow label="Status" value={data.status || 'unknown'} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Payees</h2>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {data.employees.map((payee) => (
              <div
                key={payee.id}
                className="grid gap-4 py-4 lg:grid-cols-[1fr_160px_120px_120px] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {payee.employee?.fullName || `Employee #${payee.employeeId}`}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {payee.employee?.email || 'No email'}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-slate-400">
                    {payee.employee?.walletAddress || 'No wallet'}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-slate-400">
                    Commitment: {payee.commitment || 'Not generated'}
                  </p>
                </div>

                <p className="text-sm font-semibold text-slate-900">
                  {payee.netSalary} {payee.payoutCurrency || 'USDC'}
                </p>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-center text-xs font-medium text-emerald-700">
                  {payee.status}
                </span>

                <span className="text-sm text-slate-500">Index {payee.payeeIndex ?? 0}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
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

function HashRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value?: string | null;
  onCopy: (value?: string | null) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</p>
        {value && (
          <button
            type="button"
            onClick={() => onCopy(value)}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Copy className="h-3 w-3" />
            Copy
          </button>
        )}
      </div>

      <p className="mt-1 rounded-2xl bg-slate-50 p-3 font-mono text-xs break-all text-slate-700">
        {value || 'Not generated'}
      </p>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
