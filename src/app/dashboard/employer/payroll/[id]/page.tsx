'use client';

import { Send, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatsCard } from '@/components/ui/StatsCard';
import { ROUTES } from '@/config';

const MOCK_DATA = {
  id: 'PAY-2026-001',
  date: '2026-06-23 14:30',
  total: 16300,
  status: 'Completed',
  employees: [
    { id: 1, name: 'Alice Johnson', wallet: 'G...1234', gross: 5000, net: 3500, tax: 1500 },
    { id: 2, name: 'Bob Smith', wallet: 'G...5678', gross: 6500, net: 4550, tax: 1950 },
    { id: 3, name: 'Carol Davis', wallet: 'G...9012', gross: 4800, net: 3360, tax: 1440 },
  ],
};

const STATS = [
  { label: 'Status', value: MOCK_DATA.status },
  { label: 'Employees', value: MOCK_DATA.employees.length },
  { label: 'Total Gross', value: `$${MOCK_DATA.total.toLocaleString()}` },
  { label: 'Total Net', value: `$${(MOCK_DATA.total * 0.7).toLocaleString()}` },
];

const COLUMNS = [
  { key: 'name', header: 'Employee' },
  { key: 'wallet', header: 'Wallet' },
  { key: 'gross', header: 'Gross', className: 'text-right' },
  { key: 'net', header: 'Net', className: 'text-right font-semibold text-emerald-600' },
  { key: 'tax', header: 'Tax', className: 'text-right text-slate-500' },
  {
    key: 'status',
    header: 'Status',
    className: 'text-right',
    render: () => (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
        Paid
      </span>
    ),
  },
];

export default function PayrollDetail() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={MOCK_DATA.id}
        description={`${MOCK_DATA.date} • ${MOCK_DATA.employees.length} employees`}
        backLink={{ href: ROUTES.employer.payroll, label: 'Back to Payroll' }}
        action={
          <div className="flex gap-2">
            <Button variant="outline" icon={<Clock className="h-4 w-4" />}>
              Audit Trail
            </Button>
            <Button icon={<Send className="h-4 w-4" />}>Re-run</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {STATS.map((stat, i) => (
          <StatsCard key={i} label={stat.label} value={stat.value} />
        ))}
      </div>

      <DataTable data={MOCK_DATA.employees} columns={COLUMNS} />

      <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <CheckCircle className="h-4 w-4 text-emerald-600" />
        <span>Payroll completed successfully</span>
        <span>•</span>
        <span>ZK proof verified</span>
        <span>•</span>
        <span>Tx: 0x7a3f...b9e2</span>
      </div>
    </div>
  );
}
