'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Wallet, Mail, User, Shield, Users, Coins, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROUTES } from '@/config';
import Cookies from 'js-cookie';
import type { PersonType, PersonFormData, AddPersonFormProps } from '@/types/person';
import { TYPE_LABELS, TYPE_DESCRIPTIONS } from '@/types/person';

export function AddPersonForm({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
}: AddPersonFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonFormData>({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    walletAddress: initialData?.walletAddress || '',
    type: initialData?.type || 'employee',
    title: initialData?.title || '',
    salaryUSDC: initialData?.salaryUSDC || 0,
    salaryXLM: initialData?.salaryXLM || 0,
    taxFilingStatus: initialData?.taxFilingStatus || 'single',
    allowances: initialData?.allowances || 0,
    additionalWithholding: initialData?.additionalWithholding || 0,
    isExempt: initialData?.isExempt || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const enterpriseId = Cookies.get('enterpriseId');
      if (!enterpriseId) {
        setError('No enterprise found. Please reconnect your wallet.');
        setIsLoading(false);
        return;
      }

      const cleanWallet = formData.walletAddress.trim();
      if (!cleanWallet.startsWith('G') || cleanWallet.length < 56) {
        setError('Invalid Stellar wallet address. Must start with G and be 56 characters.');
        setIsLoading(false);
        return;
      }

      if (formData.salaryUSDC <= 0 && formData.salaryXLM <= 0) {
        setError('Please enter at least one salary (USDC or XLM).');
        setIsLoading(false);
        return;
      }

      const url =
        isEditing && initialData?.id ? `/api/employees/${initialData.id}` : '/api/employees';

      const method = isEditing && initialData?.id ? 'PUT' : 'POST';

      console.log('📤 Submitting form data:', {
        url,
        method,
        fullName: formData.fullName,
        salaryUSDC: formData.salaryUSDC,
        salaryXLM: formData.salaryXLM,
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: cleanWallet,
          email: formData.email,
          fullName: formData.fullName,
          classification: formData.type,
          title: formData.title,
          salaryUSDC: formData.salaryUSDC,
          salaryXLM: formData.salaryXLM,
          taxFilingStatus: formData.taxFilingStatus,
          allowances: formData.allowances,
          additionalWithholding: formData.additionalWithholding,
          isExempt: formData.isExempt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save person');
      }

      console.log('✅ Success:', data);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(ROUTES.employer.employees);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect with Freighter';
      setError(errorMessage || 'Failed to save person');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitleLabel = () => {
    switch (formData.type) {
      case 'employee':
        return 'Department';
      case 'freelancer':
        return 'Project Name';
      case 'contractor':
      case 'vendor':
      case 'consultant':
        return 'Company Name';
      default:
        return 'Title';
    }
  };

  const getTitlePlaceholder = () => {
    switch (formData.type) {
      case 'employee':
        return 'e.g., Engineering';
      case 'freelancer':
        return 'e.g., Website Redesign';
      case 'contractor':
      case 'vendor':
      case 'consultant':
        return 'e.g., ABC Consulting';
      default:
        return 'Enter title';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Edit Person' : 'Add Person'}
        description={
          isEditing ? 'Update person details' : 'Add an employee, freelancer, contractor, or vendor'
        }
        backLink={
          onCancel ? undefined : { href: ROUTES.employer.employees, label: 'Back to People' }
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="john@company.com"
                />
              </div>
            </div>

            {/* Wallet Address - Full Width */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Stellar Wallet Address
              </label>
              <div className="relative mt-1">
                <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="G..."
                />
              </div>
              <div className="mt-2 flex flex-col gap-1 rounded-lg bg-blue-50/50 p-3 text-xs">
                <p className="text-slate-600">
                  <span className="font-medium text-slate-700">Admin Note:</span> You're entering this wallet address on behalf of the employee.
                </p>
                <p className="text-slate-500">
                  <Info className="mr-1 inline h-3 w-3" />
                  In the future, employees will be able to enter and verify their own wallet address directly.
                </p>
              </div>
            </div>

            {/* Salary USDC */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-emerald-500" />
                  Salary (USDC)
                </span>
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salaryUSDC}
                  onChange={(e) =>
                    setFormData({ ...formData, salaryUSDC: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-7 pr-4 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Enter 0 if not applicable</p>
            </div>

            {/* Salary XLM */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-blue-500" />
                  Salary (XLM)
                </span>
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">⧫</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salaryXLM}
                  onChange={(e) =>
                    setFormData({ ...formData, salaryXLM: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-7 pr-4 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Enter 0 if not applicable</p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <div className="relative mt-1">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PersonType })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-slate-500">{TYPE_DESCRIPTIONS[formData.type]}</p>
            </div>

            {/* Title / Department */}
            <div>
              <label className="block text-sm font-medium text-slate-700">{getTitleLabel()}</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder={getTitlePlaceholder()}
              />
            </div>
          </div>

          {/* Verification Banner */}
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-1.5">
                <Shield className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Wallet Verification Required</p>
                <p className="text-xs text-amber-600">
                  The employee will need to verify ownership of this wallet before receiving payments.
                </p>
                <p className="mt-1 text-xs text-amber-500">
                  <Info className="mr-1 inline h-3 w-3" />
                  Future update: Employees will be able to connect and verify their own wallet directly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            size="lg"
            loading={isLoading}
            icon={<UserPlus className="h-4 w-4" />}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isEditing ? 'Update Person' : 'Add Person'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            type="button"
            onClick={onCancel || (() => router.back())}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}