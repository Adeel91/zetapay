'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Key, Shield, FileText, History, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROUTES } from '@/config';

const STATS = [
  { label: 'Total Audits', value: '24' },
  { label: 'Pending Verification', value: '3' },
  { label: 'Verified', value: '21' },
  { label: 'Compliance Rate', value: '100%' },
];

const QUICK_ACTIONS = [
  {
    icon: Key,
    title: 'Verify Payroll',
    description: 'Enter audit key to decrypt',
    href: ROUTES.auditor.verify,
  },
  {
    icon: FileText,
    title: 'Generate Report',
    description: 'Export compliance report',
    href: ROUTES.auditor.reports,
  },
  {
    icon: History,
    title: 'Audit History',
    description: 'View past audits',
    href: ROUTES.auditor.history,
  },
];

const RECENT_AUDITS = [
  { id: 'AUD-2026-001', payroll: 'PAY-2026-001', status: 'Verified', time: '2 hours ago' },
  { id: 'AUD-2026-002', payroll: 'PAY-2026-002', status: 'Pending', time: '5 hours ago' },
  { id: 'AUD-2026-003', payroll: 'PAY-2026-003', status: 'Verified', time: '1 day ago' },
];

export default function AuditorDashboard() {
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditor Portal"
        description="Verify payroll data with zero-knowledge proofs"
        action={
          <Button onClick={handleVerify} loading={isLoading} icon={<Shield className="h-4 w-4" />}>
            Quick Verify
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <StatsCard key={i} label={stat.label} value={stat.value} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action, i) => (
          <Link key={i} href={action.href}>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-500 hover:shadow-lg">
              <div className="rounded-lg bg-indigo-50 p-2">
                <action.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">{action.title}</p>
                <p className="text-xs text-slate-500">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          <Link href={ROUTES.auditor.history} className="text-sm text-indigo-600 hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-200">
            {RECENT_AUDITS.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.payroll}</p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.status === 'Verified'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-yellow-50 text-yellow-600'
                    }`}
                  >
                    {item.status}
                  </span>
                  <Link href={`${ROUTES.auditor.verify}?id=${item.id}`}>
                    <ArrowRight className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
