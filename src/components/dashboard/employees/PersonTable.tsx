'use client';

import Link from 'next/link';
import { Edit, Trash2, Send, History } from 'lucide-react';
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

  const getPrimarySalary = (person: Person) => {
    // If both exist, show the higher one
    if (person.salaryUSDC > 0 && person.salaryXLM > 0) {
      // Convert XLM to USD (rough estimate 1 XLM = $0.10 for display purposes)
      // This is just for display - actual conversion would use a price feed
      const usdcValue = person.salaryUSDC;
      const xlmUsdValue = person.salaryXLM * 0.1; // Rough estimate

      if (usdcValue >= xlmUsdValue) {
        return {
          currency: 'USDC',
          amount: person.salaryUSDC,
          formatted: `$${person.salaryUSDC.toLocaleString()} USDC`,
          type: 'primary' as const,
        };
      } else {
        return {
          currency: 'XLM',
          amount: person.salaryXLM,
          formatted: `${person.salaryXLM.toLocaleString()} XLM`,
          type: 'primary' as const,
        };
      }
    } else if (person.salaryUSDC > 0) {
      return {
        currency: 'USDC',
        amount: person.salaryUSDC,
        formatted: `$${person.salaryUSDC.toLocaleString()} USDC`,
        type: 'primary' as const,
      };
    } else if (person.salaryXLM > 0) {
      return {
        currency: 'XLM',
        amount: person.salaryXLM,
        formatted: `${person.salaryXLM.toLocaleString()} XLM`,
        type: 'primary' as const,
      };
    }
    return null;
  };

  const getSecondarySalary = (person: Person) => {
    if (person.salaryUSDC > 0 && person.salaryXLM > 0) {
      const primary = getPrimarySalary(person);
      if (primary?.currency === 'USDC') {
        return {
          currency: 'XLM',
          amount: person.salaryXLM,
          formatted: `${person.salaryXLM.toLocaleString()} XLM`,
        };
      } else {
        return {
          currency: 'USDC',
          amount: person.salaryUSDC,
          formatted: `$${person.salaryUSDC.toLocaleString()} USDC`,
        };
      }
    }
    return null;
  };

  const hasMultipleSalaries = (person: Person) => {
    return person.salaryUSDC > 0 && person.salaryXLM > 0;
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
      key: 'salary',
      header: 'Salary',
      render: (item: Person) => {
        const primary = getPrimarySalary(item);
        const secondary = getSecondarySalary(item);
        const hasBoth = hasMultipleSalaries(item);

        if (!primary) {
          return <span className="text-sm text-slate-400">-</span>;
        }

        return (
          <div className="flex flex-col gap-0.5">
            {/* Primary Salary - shown prominently */}
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-semibold ${
                  primary.currency === 'USDC' ? 'text-emerald-600' : 'text-blue-600'
                }`}
              >
                {primary.formatted}
              </span>
              {hasBoth && <span className="text-[10px] font-medium text-slate-400">(Primary)</span>}
            </div>

            {/* Secondary Salary - shown smaller if both exist */}
            {secondary && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-medium ${
                    secondary.currency === 'USDC' ? 'text-emerald-500/70' : 'text-blue-500/70'
                  }`}
                >
                  {secondary.formatted}
                </span>
                <span className="text-[10px] text-slate-400">(Secondary)</span>
              </div>
            )}
          </div>
        );
      },
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
          <Link href={`${ROUTES.employer.employees}/${item.id}/payroll`}>
            <Button variant="ghost" size="sm" icon={<History className="h-4 w-4" />} />
          </Link>
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
