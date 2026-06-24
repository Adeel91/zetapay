'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Person } from '@/types/person';

interface RecentRecipientsProps {
  people: Person[];
  onSelect: (id: string) => void;
}

export function RecentRecipients({ people, onSelect }: RecentRecipientsProps) {
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
              ${person.salary?.toLocaleString() || '0'}
            </span>
          </button>
        ))}
        {people.length === 0 && <p className="text-sm text-slate-400">No people added yet</p>}
      </CardContent>
    </Card>
  );
}
