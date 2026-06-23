'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, CheckCircle, Clock, Download, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { ROUTES } from '@/config';

const MOCK_DATA = {
  payroll: 'PAY-2026-001',
  date: '2026-06-23 14:30',
  totalGross: 16300,
  totalNet: 11410,
  employees: [
    { id: 1, name: 'Alice Johnson', wallet: 'G...1234', gross: 5000, net: 3500, tax: 1500 },
    { id: 2, name: 'Bob Smith', wallet: 'G...5678', gross: 6500, net: 4550, tax: 1950 },
    { id: 3, name: 'Carol Davis', wallet: 'G...9012', gross: 4800, net: 3360, tax: 1440 },
  ],
};

const COLUMNS = [
  { key: 'name', header: 'Employee' },
  { key: 'wallet', header: 'Wallet' },
  { key: 'gross', header: 'Gross', className: 'text-right' },
  { key: 'net', header: 'Net', className: 'text-right font-semibold text-emerald-600' },
  { key: 'tax', header: 'Tax', className: 'text-right text-slate-500' },
];

export default function AuditorVerify() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get('id');

  const [auditKey, setAuditKey] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyType, setKeyType] = useState<'internal' | 'external' | null>(null);

  const handleVerify = () => {
    if (!auditKey.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsVerified(true);
      setKeyType(auditKey.startsWith('INT') ? 'internal' : 'external');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verify Payroll"
        description={auditId ? `Audit: ${auditId}` : 'Enter audit key to decrypt payroll data'}
        backLink={{ href: ROUTES.auditor.root, label: 'Back to Dashboard' }}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-semibold text-slate-900">Auditor Viewing Key</label>
        <p className="mt-1 text-xs text-slate-500">Enter the unique key provided by the employer</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={auditKey}
            onChange={(e) => {
              setAuditKey(e.target.value);
              if (isVerified) {
                setIsVerified(false);
                setKeyType(null);
              }
            }}
            placeholder="Paste your audit key here..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
          <Button onClick={handleVerify} disabled={!auditKey.trim() || isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Key'}
          </Button>
        </div>
        {auditKey && !isVerified && (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            Enter the key to decrypt payroll data
          </p>
        )}
      </div>

      {isVerified && (
        <div className="animate-fade-up">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-indigo-100 p-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <span className="font-semibold text-indigo-700">Decrypted Payroll Data</span>
                  <p className="text-xs text-slate-500">
                    {MOCK_DATA.payroll} • {MOCK_DATA.date}
                    {keyType === 'internal' ? ' • Full Access' : ' • Limited Access'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" icon={<FileText className="h-4 w-4" />}>
                  PDF Report
                </Button>
              </div>
            </div>

            {keyType === 'internal' ? (
              <>
                <div className="mt-4 flex gap-4 rounded-lg bg-white p-3 text-sm">
                  <div>
                    <span className="text-slate-500">Total Gross</span>
                    <p className="font-semibold text-slate-900">
                      ${MOCK_DATA.totalGross.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-slate-500">Total Net</span>
                    <p className="font-semibold text-emerald-600">
                      ${MOCK_DATA.totalNet.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-slate-500">Employees</span>
                    <p className="font-semibold text-slate-900">{MOCK_DATA.employees.length}</p>
                  </div>
                </div>
                <DataTable data={MOCK_DATA.employees} columns={COLUMNS} />
              </>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-white p-8 text-center">
                <Eye className="h-12 w-12 text-slate-300" />
                <p className="mt-2 font-medium text-slate-900">Limited Access</p>
                <p className="text-sm text-slate-500">
                  External auditors can only view aggregated data.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Total Employees</span>
                    <p className="font-semibold text-slate-900">3</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Payroll</span>
                    <p className="font-semibold text-slate-900">
                      ${MOCK_DATA.totalGross.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Tax</span>
                    <p className="font-semibold text-slate-900">
                      ${(MOCK_DATA.totalGross - MOCK_DATA.totalNet).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Compliance</span>
                    <p className="font-semibold text-emerald-600">✅ Verified</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                Data decrypted successfully
              </span>
              <span>•</span>
              <span>Audit log recorded</span>
              <span>•</span>
              <span>
                Key: {auditKey.slice(0, 8)}...{auditKey.slice(-8)}
              </span>
              <span>•</span>
              <span className="font-medium text-indigo-600">
                {keyType === 'internal' ? 'Internal Access' : 'External Access'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
