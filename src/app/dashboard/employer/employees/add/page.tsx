'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Wallet, Mail, User, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROUTES } from '@/config';

type PersonType = 'employee' | 'freelancer' | 'contractor' | 'vendor' | 'consultant';

export default function AddPerson() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    wallet: '',
    type: 'employee' as PersonType,
    department: '',
    position: '',
    company: '',
    project: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push(ROUTES.employer.employees);
    }, 1000);
  };

  const getTypeDescription = (type: PersonType) => {
    const descriptions = {
      employee: 'Full-time company employee with regular payroll',
      freelancer: 'Project-based worker paid per deliverable',
      contractor: 'Independent contractor with contract terms',
      vendor: 'Supplier or service provider',
      consultant: 'External expert or advisor',
    };
    return descriptions[type];
  };

  const getAdditionalFields = () => {
    switch (formData.type) {
      case 'employee':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                placeholder="e.g., Engineering"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Position</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                placeholder="e.g., Senior Developer"
              />
            </div>
          </>
        );
      case 'freelancer':
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700">Project Name</label>
            <input
              type="text"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              placeholder="e.g., Website Redesign"
            />
          </div>
        );
      case 'contractor':
      case 'vendor':
      case 'consultant':
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700">Company Name</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              placeholder="e.g., ABC Consulting"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Person"
        description="Add an employee, freelancer, contractor, or vendor"
        backLink={{ href: ROUTES.employer.employees, label: 'Back to People' }}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="relative mt-1">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  placeholder="john@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Stellar Wallet Address
              </label>
              <div className="relative mt-1">
                <Wallet className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.wallet}
                  onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  placeholder="G..."
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Stellar address starting with G...</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <div className="relative mt-1">
                <Users className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PersonType })}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="contractor">Contractor</option>
                  <option value="vendor">Vendor</option>
                  <option value="consultant">Consultant</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-slate-500">{getTypeDescription(formData.type)}</p>
            </div>

            {getAdditionalFields()}
          </div>

          <div className="mt-4 rounded-lg bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-700">Verification Required</p>
                <p className="text-xs text-yellow-600">
                  New people will need to verify their wallet before receiving payments. An
                  invitation will be sent to their email.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" loading={isLoading} icon={<UserPlus className="h-4 w-4" />}>
            Add Person
          </Button>
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
