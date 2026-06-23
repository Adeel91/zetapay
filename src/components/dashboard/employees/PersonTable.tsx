'use client';

import Link from 'next/link';
import { Edit, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { PersonTypeBadge } from './PersonTypeBadge';
import { ROUTES } from '@/config';
import { PersonTableProps, Person } from '@/types/person';

const truncateWallet = (address: string) => {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

interface PersonTableWithDeleteProps extends PersonTableProps {
  onDelete?: (id: string) => void;
}

export function PersonTable({
  people,
  onRowClick,
  onDelete,
  emptyMessage = 'No people found',
}: PersonTableWithDeleteProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this person?')) return;

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete person');
      }

      if (onDelete) {
        onDelete(id);
      }
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('Failed to delete person');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: Person) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {item.name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-medium text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-400">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'wallet',
      header: 'Wallet',
      render: (item: Person) => (
        <span className="font-mono text-sm text-slate-600" title={item.wallet}>
          {truncateWallet(item.wallet)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: Person) => <PersonTypeBadge type={item.type} />,
    },
    {
      key: 'title',
      header: 'Title',
      render: (item: Person) => <span className="text-sm text-slate-500">{item.title || '-'}</span>,
    },
    {
      key: 'verified',
      header: 'Status',
      render: (item: Person) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            item.verified ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'
          }`}
        >
          {item.verified ? 'Verified' : 'Pending'}
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
            <Button variant="ghost" size="sm" icon={<Send className="h-4 w-4" />} />
          </Link>
          <Link href={`${ROUTES.employer.employees}/edit/${item.id}`}>
            <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />} />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => handleDelete(item.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable<Person>
      data={people}
      columns={columns}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage}
    />
  );
}
