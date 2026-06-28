'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileWarning } from 'lucide-react';

import { ROUTES } from '@/config';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PayrollReviewHeader } from '@/components/dashboard/payroll/review/PayrollReviewHeader';
import { PayrollReviewTable } from '@/components/dashboard/payroll/review/PayrollReviewTable';
import { PayrollReviewValidationCard } from '@/components/dashboard/payroll/review/PayrollReviewValidationCard';
import { PayrollReviewActions } from '@/components/dashboard/payroll/review/PayrollReviewActions';
import { PayrollReviewDraft } from '@/components/dashboard/payroll/review/types';

type GeneratedPayrollResult = {
  success: boolean;
  payrollRunId: number;
  status: string;
  batchRoot: string;
  payrollRunHash: string;
  proofHash: string;
  publicVerificationUrl?: string;
  publicVerificationToken?: string;
  employerPayrollUrl?: string;
  employeeVerificationLinks?: {
    employeeId: number;
    payrollEmployeeId: number;
    verificationUrl: string;
    token: string;
  }[];
  totals: {
    xlm: number;
    usdc: number;
    payeeCount: number;
    batchCount: number;
  };
};

type PayrollErrorResponse = {
  error?: string;
  message?: string;
};

function readDraftFromSession(): PayrollReviewDraft | null {
  const raw = window.sessionStorage.getItem('zetapayPayrollDraft');

  if (!raw) return null;

  try {
    return JSON.parse(raw) as PayrollReviewDraft;
  } catch {
    return null;
  }
}

export default function PayrollReviewPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<PayrollReviewDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setDraft(readDraftFromSession());
      setMounted(true);
    });
  }, []);

  const validation = useMemo(() => {
    const items = draft?.items ?? [];

    return {
      hasPayees: items.length > 0,
      allWalletsValid: items.every((item) => Boolean(item.wallet)),
      allAmountsValid: items.every((item) => Number(item.amount) > 0),
      hasCurrencyOverrides: items.some((item) => item.currencyOverridden),
    };
  }, [draft]);

  const canGenerate =
    validation.hasPayees && validation.allWalletsValid && validation.allAmountsValid;

  async function handleGenerateProof() {
    if (!draft || generating) return;

    setGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: draft.periodStart,
          periodEnd: draft.periodEnd,
          items: draft.items.map((item) => ({
            personId: item.personId,
            amount: item.amount,
            currency: item.currency,
          })),
        }),
      });

      const result = (await response.json()) as GeneratedPayrollResult & PayrollErrorResponse;

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to generate payroll');
      }

      window.sessionStorage.setItem('zetapayGeneratedPayroll', JSON.stringify(result));
      window.sessionStorage.removeItem('zetapayPayrollDraft');

      router.push(ROUTES.employer.payrollDetails(String(result.payrollRunId)));
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <FileWarning className="h-7 w-7 text-amber-600" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">No payroll draft found</h1>

          <p className="mt-2 text-sm text-slate-500">
            Create a payroll run first, then return here to review and generate proof material.
          </p>

          <Button
            className="mt-6 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => router.push(ROUTES.employer.payrollNew)}
          >
            Create payroll run
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Review"
        description="Confirm payroll details before generating the ZK payroll proof."
        backLink={{ href: ROUTES.employer.payrollNew, label: 'Back to Builder' }}
      />

      <PayrollReviewHeader draft={draft} />

      {generationError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {generationError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <PayrollReviewTable items={draft.items} />

          <PayrollReviewActions
            canGenerate={canGenerate}
            generating={generating}
            generated={false}
            onBack={() => router.push(ROUTES.employer.payrollNew)}
            onGenerate={handleGenerateProof}
          />
        </div>

        <PayrollReviewValidationCard validation={validation} />
      </div>
    </div>
  );
}
