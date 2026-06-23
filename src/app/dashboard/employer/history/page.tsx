'use client';

import Link from 'next/link';
import { History, Eye } from 'lucide-react';
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
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
        {item.status}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    className: 'text-right',
    render: (item: AuditRecord) => (
      <Link href={`${ROUTES.auditor.verify}?id=${item.id}`}>
        <Eye className="h-4 w-4 text-slate-400 hover:text-emerald-600" />
      </Link>
    ),
  },
];

export default function AuditHistory() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit History" description="View all past audit verifications" />

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
