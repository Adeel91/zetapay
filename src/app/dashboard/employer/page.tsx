'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, DollarSign, Send, Clock, FileText, Plus, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatsCard } from '@/components/ui/StatsCard';
import { QuickAction } from '@/components/ui/QuickAction';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROUTES } from '@/config';
import type { Person } from '@/types/person';

type EmployeeView = Pick<Person, 'id' | 'name' | 'wallet'> & {
  salary: number;
  status: 'Active' | 'Inactive' | 'Pending';
};

const MOCK_EMPLOYEES: EmployeeView[] = [
  { id: '1', name: 'Alice Johnson', wallet: 'G...1234', salary: 5000, status: 'Active' },
  { id: '2', name: 'Bob Smith', wallet: 'G...5678', salary: 6500, status: 'Active' },
  { id: '3', name: 'Carol Davis', wallet: 'G...9012', salary: 4800, status: 'Active' },
];

const STATS = [
  { icon: Users, label: 'Employees', value: MOCK_EMPLOYEES.length },
  {
    icon: DollarSign,
    label: 'Total Payroll',
    value: `$${MOCK_EMPLOYEES.reduce((s, e) => s + e.salary, 0).toLocaleString()}`,
  },
  { icon: Send, label: 'Status', value: 'Ready' },
  { icon: Clock, label: 'This Month', value: '$24,500' },
];

const QUICK_ACTIONS = [
  {
    icon: FileText,
    title: 'New Payroll',
    description: 'Run payroll this period',
    href: ROUTES.employer.payroll,
  },
  {
    icon: Plus,
    title: 'Add Employee',
    description: 'Add to payroll',
    href: ROUTES.employer.addEmployee,
  },
  {
    icon: TrendingUp,
    title: 'History',
    description: 'View past runs',
    href: ROUTES.employer.history,
  },
  {
    icon: Send,
    title: 'Send Payment',
    description: 'Pay employees, freelancers, or contractors',
    href: ROUTES.employer.send,
  },
];

const COLUMNS = [
  { key: 'name', header: 'Employee' },
  { key: 'wallet', header: 'Wallet' },
  { key: 'salary', header: 'Salary', className: 'text-right' },
  {
    key: 'status',
    header: 'Status',
    className: 'text-right',
    render: (item: EmployeeView) => (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
        {item.status}
      </span>
    ),
  },
];

export default function EmployerDashboard() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employer Dashboard"
        description="Run payroll with zero-knowledge privacy"
        action={
          <Button
            variant={isConnected ? 'secondary' : 'primary'}
            icon={<Wallet className="h-4 w-4" />}
            onClick={() => setIsConnected(!isConnected)}
          >
            {isConnected ? 'Connected' : 'Connect Wallet'}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <StatsCard
            key={i}
            icon={<stat.icon className="h-4 w-4" />}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action, i) => (
          <Link key={i} href={action.href}>
            <QuickAction
              icon={<action.icon className="h-5 w-5 text-emerald-600" />}
              title={action.title}
              description={action.description}
            />
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Employees</h3>
          <Link
            href={ROUTES.employer.employees}
            className="text-sm text-emerald-600 hover:underline"
          >
            View All
          </Link>
        </div>
        <DataTable<EmployeeView> data={MOCK_EMPLOYEES} columns={COLUMNS} />
      </div>
    </div>
  );
}
