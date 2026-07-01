'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Clock,
  FileText,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react';
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
  type?: string | null;
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
      const response = await fetch(API.employees.byEnterprise(parseInt(enterpriseId, 10)));
      const data = await response.json();

      const mapped: EmployeeView[] = (Array.isArray(data) ? data : []).map(
        (emp: ApiEmployeeRecord) => ({
          id: String(emp.id),
          name: emp.fullName || 'Unknown person',
          wallet: emp.walletAddress || 'No wallet',
          salary: emp.salary ? parseFloat(String(emp.salary)) : 0,
          status: emp.status === 'active' ? 'Active' : 'Inactive',
        })
      );

      setEmployees(mapped);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await Promise.resolve();

      if (!cancelled) {
        await fetchEmployees();
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [fetchEmployees]);

  const totalPayroll = useMemo(
    () => employees.reduce((sum, employee) => sum + employee.salary, 0),
    [employees]
  );

  const activePeople = employees.filter((employee) => employee.status === 'Active').length;

  const STATS = [
    {
      icon: Users,
      label: 'People',
      value: employees.length,
    },
    {
      icon: ShieldCheck,
      label: 'Confidential mode',
      value: 'Enabled',
    },
    {
      icon: LockKeyhole,
      label: 'Encrypted records',
      value: 'On chain',
    },
    {
      icon: Activity,
      label: 'Ready payees',
      value: activePeople,
    },
  ];

  const QUICK_ACTIONS = [
    {
      icon: Send,
      title: 'Run confidential payroll',
      description: 'Generate proof, encrypt records, and settle payroll',
      href: ROUTES.employer.payroll,
    },
    {
      icon: Users,
      title: 'Manage people',
      description: 'Employees, freelancers, vendors, and contractors',
      href: ROUTES.employer.employees,
    },
    {
      icon: FileText,
      title: 'Payroll history',
      description: 'Review encrypted proof records and settlement history',
      href: ROUTES.employer.history,
    },
    {
      icon: UserPlus,
      title: 'Add person',
      description: 'Add a new payee wallet and profile',
      href: ROUTES.employer.addEmployee,
    },
  ];

  const COLUMNS = [
    { key: 'name', header: 'Name' },
    {
      key: 'wallet',
      header: 'Wallet',
      render: (item: EmployeeView) => (
        <span className="font-mono text-xs text-slate-500">
          {item.wallet.length > 14
            ? `${item.wallet.slice(0, 6)}…${item.wallet.slice(-6)}`
            : item.wallet}
        </span>
      ),
    },
    {
      key: 'salary',
      header: 'Payroll record',
      className: 'text-right',
      render: () => (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <LockKeyhole className="h-3 w-3" />
          Encrypted
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-right',
      render: (item: EmployeeView) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            item.status === 'Active'
              ? 'bg-emerald-50 text-emerald-700'
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
      <PageHeader
        title="Employer Dashboard"
        description="Manage confidential payroll, encrypted proof records, and Stellar settlement activity."
      />

      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-950 p-6 text-white shadow-xl shadow-emerald-900/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm text-emerald-50">
              <Sparkles className="h-4 w-4" />
              Zero knowledge confidential payroll
            </div>

            <h2 className="mt-4 max-w-2xl text-3xl font-bold">
              Encrypt payroll records, prove correctness, and settle on Stellar.
            </h2>

            <p className="mt-3 max-w-2xl text-sm text-emerald-50/80">
              Payroll contents are stored as encrypted on chain records with proof metadata and
              employee verification links.
            </p>
          </div>

          <Link
            href={ROUTES.employer.payrollNew}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-lg hover:bg-emerald-50"
          >
            Start payroll
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <HeroPill icon={<ShieldCheck className="h-4 w-4" />} label="Groth16 proof verified" />
          <HeroPill icon={<LockKeyhole className="h-4 w-4" />} label="Encrypted payroll blobs" />
          <HeroPill icon={<WalletCards className="h-4 w-4" />} label="Stellar settlement ready" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatsCard
            key={stat.label}
            icon={<stat.icon className="h-4 w-4" />}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.title} href={action.href}>
            <QuickAction
              icon={<action.icon className="h-5 w-5 text-emerald-600" />}
              title={action.title}
              description={action.description}
            />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent people</h3>
            <Link
              href={ROUTES.employer.employees}
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {employees.length > 0 ? (
            <DataTable<EmployeeView> data={employees.slice(0, 5)} columns={COLUMNS} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              No people added yet. Add your first payee to start confidential payroll.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SideCard
            icon={<LockKeyhole className="h-5 w-5 text-emerald-600" />}
            title="Confidential storage"
            text="Payroll rows are written as encrypted payloads instead of plaintext records."
          />

          <SideCard
            icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
            title="Proof backed"
            text="Each run includes commitment roots, proof hash, and employee note verification."
          />

          <SideCard
            icon={<Clock className="h-5 w-5 text-emerald-600" />}
            title="Current payroll estimate"
            text={`Internal estimate: $${totalPayroll.toLocaleString()}. This dashboard keeps the public proof page private.`}
          />
        </div>
      </div>
    </div>
  );
}

function HeroPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm text-emerald-50 ring-1 ring-white/10">
      {icon}
      {label}
    </div>
  );
}

function SideCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
          {icon}
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
