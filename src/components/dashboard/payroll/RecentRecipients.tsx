'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Person } from '@/types/person';

interface RecentRecipientsProps {
  people: Person[];
  onSelect: (id: string) => void;
}

export function RecentRecipients({ people, onSelect }: RecentRecipientsProps) {
  const hasSalary = (person: Person) => {
    return (
      (person.salaryUSDC && person.salaryUSDC > 0) || (person.salaryXLM && person.salaryXLM > 0)
    );
  };

  const getSalaryDisplay = (person: Person) => {
    const parts = [];
    if (person.salaryUSDC && person.salaryUSDC > 0) {
      parts.push(`${person.salaryUSDC.toLocaleString()} USDC`);
    }
    if (person.salaryXLM && person.salaryXLM > 0) {
      parts.push(`${person.salaryXLM.toLocaleString()} XLM`);
    }
    return parts.join(' • ') || '0';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recent Recipients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {people.slice(0, 3).map((person) => (
          <button
            key={person.id}
            onClick={() => onSelect(person.id)}
            className="flex w-full items-center justify-between rounded-lg p-2 text-sm hover:bg-slate-50"
          >
            <span className="font-medium text-slate-700">{person.name}</span>
            <span className="text-xs text-slate-400">
              {hasSalary(person) ? getSalaryDisplay(person) : '0'}
            </span>
          </button>
        ))}
        {people.length === 0 && <p className="text-sm text-slate-400">No people added yet</p>}
      </CardContent>
    </Card>
  );
}
