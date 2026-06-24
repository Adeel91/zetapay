'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, DollarSign, Send, Clock, FileText, UserPlus } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { QuickAction } from '@/components/ui/QuickAction';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROUTES, API } from '@/config';
import Cookies from 'js-cookie';
import type { Person } from '@/types/person';

type EmployeeView = Pick<Person, 'id' | 'name' | 'wallet'> & {
  salary: number;
  status: 'Active' | 'Inactive' | 'Pending';
};

interface ApiEmployeeRecord {
  id: number | string;
  fullName?: string;
  walletAddress?: string;
  salary?: string | number;
  status?: string;
}

export default function EmployerDashboard() {
  const [employees, setEmployees] = useState<EmployeeView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    const enterpriseId = Cookies.get('enterpriseId');
    if (!enterpriseId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API.employees.byEnterprise(parseInt(enterpriseId)));
      const data = await response.json();

      const mapped: EmployeeView[] = data.map((emp: ApiEmployeeRecord) => ({
        id: String(emp.id),
        name: emp.fullName || 'Unknown',
        wallet: emp.walletAddress || 'G...',
        salary: emp.salary ? parseFloat(String(emp.salary)) : 0,
        status: emp.status === 'active' ? 'Active' : 'Inactive',
      }));

      setEmployees(mapped);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const triggerFetch = async () => {
      await Promise.resolve();
      if (isMounted) {
        await fetchEmployees();
      }
    };

    triggerFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchEmployees]);

  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);

  const STATS = [
    { icon: Users, label: 'Total People', value: employees.length },
    { icon: DollarSign, label: 'Total Payroll', value: `$${totalPayroll.toLocaleString()}` },
    { icon: Send, label: 'Status', value: employees.length > 0 ? 'Ready' : 'No employees' },
    { icon: Clock, label: 'This Month', value: `$${totalPayroll.toLocaleString()}` },
  ];

  const QUICK_ACTIONS = [
    {
      icon: Users,
      title: 'People',
      description: 'Manage all employees and contractors',
      href: ROUTES.employer.employees,
    },
    {
      icon: Send,
      title: 'Send Payment',
      description: 'Pay employees, freelancers, or contractors',
      href: ROUTES.employer.send,
    },
    {
      icon: FileText,
      title: 'History',
      description: 'View past payment runs',
      href: ROUTES.employer.history,
    },
    {
      icon: UserPlus,
      title: 'Add Person',
      description: 'Add to payroll',
      href: ROUTES.employer.addEmployee,
    },
  ];

  const COLUMNS = [
    { key: 'name', header: 'Name' },
    { key: 'wallet', header: 'Wallet' },
    { key: 'salary', header: 'Salary', className: 'text-right' },
    {
      key: 'status',
      header: 'Status',
      className: 'text-right',
      render: (item: EmployeeView) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            item.status === 'Active'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your payroll activity" />

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

      <div className="grid gap-4 sm:grid-cols-4">
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
          <h3 className="font-semibold text-slate-900">Recent People</h3>
          <Link
            href={ROUTES.employer.employees}
            className="text-sm text-emerald-600 hover:underline"
          >
            View All
          </Link>
        </div>
        {employees.length > 0 ? (
          <DataTable<EmployeeView> data={employees.slice(0, 5)} columns={COLUMNS} />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No employees added yet. Add your first person to get started.
          </div>
        )}
      </div>
    </div>
  );
}
