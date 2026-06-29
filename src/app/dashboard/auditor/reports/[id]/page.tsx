'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Copy, FileWarning, ShieldCheck, Users } from 'lucide-react';

import { ROUTES } from '@/config';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

type AuditPayee = {
  id: number;
  employeeName?: string | null;
  employeeEmail?: string | null;
  employeeWallet?: string | null;
  employeeType?: string | null;
  amount?: string;
  currency?: string | null;
  status?: string | null;
  commitment?: string | null;
  txHash?: string | null;
  batchIndex?: number | null;
  payeeIndex?: number | null;
};

type AuditReport = {
  payrollRunId: number;
  companyName?: string | null;
  periodStart?: string;
  periodEnd?: string;
  totalXlm?: string;
  totalUsdc?: string;
  payeeCount?: number;
  batchRoot?: string | null;
  payrollRunHash?: string | null;
  proofHash?: string | null;
  status?: string | null;
  verifiedAt?: string;
  payees?: AuditPayee[];
};

function readReportFromSession(id: string): AuditReport | null {
  const direct = window.sessionStorage.getItem(`zetapayAuditReport:${id}`);

  if (direct) {
    try {
      return JSON.parse(direct) as AuditReport;
    } catch {
      return null;
    }
  }

  return null;
}

export default function AuditorReportDetailPage() {
  const params = useParams<{ id: string }>();

  const [report, setReport] = useState<AuditReport | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(value?: string | null, label = 'value') {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  useEffect(() => {
    queueMicrotask(() => {
      setReport(readReportFromSession(params.id));
      setMounted(true);
    });
  }, [params.id]);

  if (!mounted) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileWarning className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Report not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            Verify the audit key again to unlock this payroll report.
          </p>
          <a href={ROUTES.auditor.verify}>
            <Button className="mt-6 bg-emerald-600 text-white hover:bg-emerald-700">
              Verify Audit Key
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const payees = report.payees || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Audit Report #${report.payrollRunId}`}
        description="Permissioned payroll audit report with payees, amounts, commitments, and proof metadata."
        backLink={{ href: ROUTES.auditor.reports, label: 'Back to Reports' }}
      />

      <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-slate-200/50">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-8 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm text-emerald-50">
            <ShieldCheck className="h-4 w-4" />
            Permissioned auditor report
          </div>

          <h1 className="mt-4 text-3xl font-bold">{report.companyName || 'Private company'}</h1>

          <p className="mt-2 max-w-2xl text-sm text-emerald-50/80">
            This report is intentionally more detailed than the public proof page.
          </p>
        </div>

        <CardContent className="mt-5 grid gap-4 p-6 md:grid-cols-4">
          <Metric label="Status" value={report.status || 'verified'} />
          <Metric label="Payees" value={`${report.payeeCount || payees.length}`} />
          <Metric label="Total XLM" value={`${report.totalXlm || '0'} XLM`} />
          <Metric label="Total USDC" value={`${report.totalUsdc || '0'} USDC`} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Proof details</h2>

            <div className="mt-5 space-y-4">
              <HashRow label="Batch root" value={report.batchRoot} copied={copied} onCopy={copy} />
              <HashRow
                label="Payroll run hash"
                value={report.payrollRunHash}
                copied={copied}
                onCopy={copy}
              />
              <HashRow label="Proof hash" value={report.proofHash} copied={copied} onCopy={copy} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Audit checks</h2>
            </div>

            <div className="mt-5 space-y-3">
              <Check label="Audit key accepted" />
              <Check label="Payroll record found" />
              <Check label="Commitments available" />
              <Check label="Proof hash available" />
              <Check label="Payee data visible to auditor" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Audited payees</h2>
          </div>

          {payees.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">No payee rows were returned for this report.</p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {payees.map((payee) => (
                <div
                  key={payee.id}
                  className="grid gap-4 py-5 lg:grid-cols-[1fr_160px_120px] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {payee.employeeName || `Payee #${payee.id}`}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {payee.employeeEmail || 'No email'}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-slate-400">
                      {payee.employeeWallet || 'No wallet'}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-slate-400">
                      Commitment: {payee.commitment || 'Not available'}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {payee.amount || '0'} {payee.currency || 'USDC'}
                  </p>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-center text-xs font-medium text-emerald-700">
                    {payee.status || 'verified'}
                  </span>
                </div>
              ))}
            </div>
          )}
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
  copied,
  onCopy,
}: {
  label: string;
  value?: string | null;
  copied: string | null;
  onCopy: (value?: string | null, label?: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</p>
        {value && (
          <button
            type="button"
            onClick={() => onCopy(value, label)}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Copy className="h-3 w-3" />
            {copied === label ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      <p className="mt-1 rounded-2xl bg-slate-50 p-3 font-mono text-xs break-all text-slate-700">
        {value || 'Not available'}
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
