'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

const SETTINGS_SECTIONS = [
  {
    title: 'General',
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', defaultValue: 'ZetaPay Inc.' },
      { id: 'companyEmail', label: 'Company Email', type: 'email', defaultValue: 'hr@zetapay.com' },
      {
        id: 'currency',
        label: 'Default Currency',
        type: 'select',
        options: ['USDC', 'XLM', 'EURC'],
      },
      {
        id: 'taxRegion',
        label: 'Tax Region',
        type: 'select',
        options: ['United States', 'Europe', 'United Kingdom'],
      },
    ],
  },
  {
    title: 'Payroll Settings',
    fields: [
      {
        id: 'frequency',
        label: 'Pay Frequency',
        type: 'select',
        options: ['Monthly', 'Bi-weekly', 'Weekly'],
      },
      {
        id: 'autoProcess',
        label: 'Auto-Process',
        type: 'select',
        options: ['Enabled', 'Disabled'],
      },
    ],
  },
];

export default function CompanySettings() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Company Settings" description="Manage your company preferences" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {SETTINGS_SECTIONS.map((section) => (
          <div key={section.title} className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-900">{section.title}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      defaultValue={field.defaultValue}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt.toLowerCase()}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      defaultValue={field.defaultValue}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Security</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Require Approval</p>
              <p className="text-sm text-slate-500">
                Require admin approval before payroll execution
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" defaultChecked />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>

        <Button type="submit" loading={isLoading} icon={<Save className="h-4 w-4" />}>
          Save Settings
        </Button>
      </form>
    </div>
  );
}
