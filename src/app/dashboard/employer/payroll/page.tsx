'use client';

import Link from 'next/link';
import { History, Eye } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/config';
import type { PayrollHistoryItem } from '@/types/payroll';

const MOCK_HISTORY: PayrollHistoryItem[] = [
  {
    id: 'PAY-2026-001',
    date: '2026-06-23 14:30',
    employees: 3,
    total: '$16,300',
    status: 'Completed',
  },
  {
    id: 'PAY-2026-002',
    date: '2026-06-22 09:15',
    employees: 2,
    total: '$11,500',
    status: 'Completed',
  },
];

const COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'date', header: 'Date' },
  { key: 'employees', header: 'Employees', className: 'text-center' },
  { key: 'total', header: 'Total', className: 'text-right' },
  {
    key: 'status',
    header: 'Status',
    className: 'text-center',
    render: (item: PayrollHistoryItem) => (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
        {item.status}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    className: 'text-right',
    render: (item: PayrollHistoryItem) => (
      <Link href={ROUTES.employer.payrollDetail(item.id)}>
        <Eye className="h-4 w-4 text-slate-400 hover:text-emerald-600" />
      </Link>
    ),
  },
];

export default function PayrollHistory() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payroll History" description="View all past payroll runs" />

      {MOCK_HISTORY.length > 0 ? (
        <DataTable<PayrollHistoryItem> data={MOCK_HISTORY} columns={COLUMNS} />
      ) : (
        <EmptyState
          icon={<History className="h-8 w-8 text-slate-300" />}
          title="No payroll history"
          description="Run your first payroll to get started"
        />
      )}
    </div>
  );
}
