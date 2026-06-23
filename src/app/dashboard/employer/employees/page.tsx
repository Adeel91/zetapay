'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Search, Edit, Trash2, CheckCircle, XCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/config';
import type { Person, PersonType } from '@/types/person';
import { TYPE_COLORS, TYPE_LABELS } from '@/types/person';

const MOCK_PEOPLE: Person[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    wallet: 'G...1234',
    email: 'alice@company.com',
    type: 'employee',
    verified: true,
    createdAt: '2026-06-01',
    department: 'Engineering',
    position: 'Senior Developer',
  },
  {
    id: '2',
    name: 'Bob Smith',
    wallet: 'G...5678',
    email: 'bob@company.com',
    type: 'employee',
    verified: true,
    createdAt: '2026-06-02',
    department: 'Sales',
    position: 'Sales Manager',
  },
  {
    id: '3',
    name: 'John Freelancer',
    wallet: 'G...3456',
    email: 'john@freelance.com',
    type: 'freelancer',
    verified: true,
    createdAt: '2026-06-05',
    project: 'Website Redesign',
  },
  {
    id: '4',
    name: 'Sarah Contractor',
    wallet: 'G...7890',
    email: 'sarah@contractor.com',
    type: 'contractor',
    verified: false,
    createdAt: '2026-06-10',
    company: "Sarah's Consulting",
  },
  {
    id: '5',
    name: 'Mike Vendor',
    wallet: 'G...9012',
    email: 'mike@vendor.com',
    type: 'vendor',
    verified: true,
    createdAt: '2026-06-12',
    company: "Mike's Supplies",
  },
];

const columns = [
  {
    key: 'name',
    header: 'Name',
    render: (item: Person) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {item.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-400">{item.email}</p>
        </div>
      </div>
    ),
  },
  { key: 'wallet', header: 'Wallet' },
  {
    key: 'type',
    header: 'Type',
    render: (item: Person) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type]}`}>
        {TYPE_LABELS[item.type]}
      </span>
    ),
  },
  {
    key: 'details',
    header: 'Details',
    render: (item: Person) => (
      <span className="text-sm text-slate-500">
        {item.department || item.position || item.project || item.company || '-'}
      </span>
    ),
  },
  {
    key: 'verified',
    header: 'Status',
    render: (item: Person) => (
      <span
        className={`flex items-center gap-1 text-xs font-medium ${item.verified ? 'text-emerald-600' : 'text-yellow-600'}`}
      >
        {item.verified ? (
          <>
            <CheckCircle className="h-3 w-3" />
            Verified
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3" />
            Pending
          </>
        )}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    className: 'text-right',
    render: (item: Person) => (
      <div className="flex justify-end gap-2">
        <Link href={`${ROUTES.employer.send}?recipient=${item.id}`}>
          <Button variant="ghost" size="sm" icon={<Send className="h-4 w-4" />}>
            Pay
          </Button>
        </Link>
        <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />} />
        <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} />
      </div>
    ),
  },
];

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | PersonType>('all');

  const filteredPeople = MOCK_PEOPLE.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: MOCK_PEOPLE.length,
    employees: MOCK_PEOPLE.filter((p) => p.type === 'employee').length,
    contractors: MOCK_PEOPLE.filter((p) => p.type === 'freelancer' || p.type === 'contractor')
      .length,
    vendors: MOCK_PEOPLE.filter((p) => p.type === 'vendor' || p.type === 'consultant').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employees, freelancers, contractors, and vendors"
        action={
          <Link href={ROUTES.employer.addEmployee}>
            <Button icon={<UserPlus className="h-4 w-4" />}>Add Person</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-sm text-slate-500">Total People</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-emerald-600">{stats.employees}</p>
          <p className="text-sm text-slate-500">Employees</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-indigo-600">{stats.contractors}</p>
          <p className="text-sm text-slate-500">Freelancers/Contractors</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-purple-600">{stats.vendors}</p>
          <p className="text-sm text-slate-500">Vendors/Consultants</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-slate-200 py-2 pr-4 pl-9 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'employee', 'freelancer', 'contractor', 'vendor', 'consultant'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type as typeof typeFilter)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'all' ? 'All' : TYPE_LABELS[type as PersonType]}
            </button>
          ))}
        </div>
      </div>

      {filteredPeople.length > 0 ? (
        <DataTable<Person> data={filteredPeople} columns={columns} />
      ) : (
        <EmptyState
          icon={<Users className="h-8 w-8 text-slate-300" />}
          title="No people found"
          description="Add employees, freelancers, or contractors to get started"
          action={
            <Link href={ROUTES.employer.addEmployee}>
              <Button icon={<UserPlus className="h-4 w-4" />}>Add Person</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
