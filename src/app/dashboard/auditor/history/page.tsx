'use client';

import Link from 'next/link';
import { History, Eye, Shield } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/config';
import type { AuditRecord } from '@/types/audit';

const MOCK_AUDIT_HISTORY: AuditRecord[] = [
  {
    id: 'AUD-2026-001',
    date: '2026-06-23 14:30',
    payroll: 'PAY-2026-001',
    status: 'Verified',
    auditor: 'Internal',
    keyType: 'Full Access',
    employeeCount: 3,
  },
  {
    id: 'AUD-2026-002',
    date: '2026-06-22 09:15',
    payroll: 'PAY-2026-002',
    status: 'Verified',
    auditor: 'External',
    keyType: 'Limited Access',
    employeeCount: 2,
  },
  {
    id: 'AUD-2026-003',
    date: '2026-06-21 16:45',
    payroll: 'PAY-2026-003',
    status: 'Pending',
    auditor: 'Internal',
    keyType: 'Full Access',
    employeeCount: 4,
  },
];

const COLUMNS = [
  { key: 'id', header: 'Audit ID' },
  { key: 'date', header: 'Date' },
  { key: 'payroll', header: 'Payroll' },
  { key: 'auditor', header: 'Auditor Type' },
  { key: 'keyType', header: 'Access Level' },
  { key: 'employeeCount', header: 'Employees', className: 'text-center' },
  {
    key: 'status',
    header: 'Status',
    className: 'text-center',
    render: (item: AuditRecord) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          item.status === 'Verified'
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-yellow-50 text-yellow-600'
        }`}
      >
        {item.status}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    className: 'text-right',
    render: (item: AuditRecord) => (
      <div className="flex justify-end gap-2">
        <Link href={`${ROUTES.auditor.verify}?id=${item.id}`}>
          <Eye className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
        </Link>
        <Shield
          className={`h-4 w-4 ${
            item.status === 'Verified' ? 'text-emerald-500' : 'text-slate-300'
          }`}
        />
      </div>
    ),
  },
];

export default function AuditHistory() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit History" description="View all past audit verifications" />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-slate-900">24</p>
          <p className="text-sm text-slate-500">Total Audits</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-emerald-600">21</p>
          <p className="text-sm text-slate-500">Verified</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-yellow-600">3</p>
          <p className="text-sm text-slate-500">Pending</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-indigo-600">100%</p>
          <p className="text-sm text-slate-500">Compliance Rate</p>
        </div>
      </div>

      {MOCK_AUDIT_HISTORY.length > 0 ? (
        <DataTable<AuditRecord> data={MOCK_AUDIT_HISTORY} columns={COLUMNS} />
      ) : (
        <EmptyState
          icon={<History className="h-8 w-8 text-slate-300" />}
          title="No audit history"
          description="Complete your first audit to get started"
        />
      )}
    </div>
  );
}
