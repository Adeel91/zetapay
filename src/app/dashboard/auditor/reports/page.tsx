'use client';

import { useState } from 'react';
import { FileText, Download, Calendar, Filter, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Report } from '@/types/report';

const MOCK_REPORTS: Report[] = [
  {
    id: 'RPT-2026-001',
    name: 'Q2 Compliance Report',
    date: '2026-06-23',
    type: 'PDF',
    size: '2.4 MB',
    status: 'Ready',
  },
  {
    id: 'RPT-2026-002',
    name: 'Payroll Audit Summary',
    date: '2026-06-22',
    type: 'CSV',
    size: '856 KB',
    status: 'Ready',
  },
  {
    id: 'RPT-2026-003',
    name: 'Annual Tax Report',
    date: '2026-06-20',
    type: 'PDF',
    size: '4.1 MB',
    status: 'Processing',
  },
];

const COLUMNS = [
  { key: 'name', header: 'Report Name' },
  { key: 'date', header: 'Date' },
  { key: 'type', header: 'Type' },
  { key: 'size', header: 'Size' },
  {
    key: 'status',
    header: 'Status',
    className: 'text-center',
    render: (item: Report) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          item.status === 'Ready'
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
    render: () => (
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />}>
          View
        </Button>
        <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>
          Download
        </Button>
      </div>
    ),
  },
];

export default function AuditorReports() {
  const [dateRange, setDateRange] = useState('last30');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export compliance reports"
        action={<Button icon={<FileText className="h-4 w-4" />}>Generate Report</Button>}
      />

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports..."
            className="w-full rounded-lg border border-slate-200 py-1.5 pr-3 pl-9 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <Button variant="outline" size="sm" icon={<Filter className="h-4 w-4" />}>
          Filter
        </Button>
      </div>

      {MOCK_REPORTS.length > 0 ? (
        <DataTable<Report> data={MOCK_REPORTS} columns={COLUMNS} />
      ) : (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-slate-300" />}
          title="No reports generated"
          description="Generate your first compliance report"
          action={<Button icon={<FileText className="h-4 w-4" />}>Generate Report</Button>}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">12</p>
          <p className="text-sm text-slate-500">Reports this month</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">8</p>
          <p className="text-sm text-slate-500">Downloaded</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">100%</p>
          <p className="text-sm text-slate-500">Compliance rate</p>
        </div>
      </div>
    </div>
  );
}
