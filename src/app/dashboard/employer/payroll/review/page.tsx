'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, FileWarning } from 'lucide-react';

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
  verificationUrl?: string;
  verificationToken?: string;
  totals: {
    xlm: number;
    usdc: number;
    payeeCount: number;
    batchCount: number;
  };
};

function readDraftFromSession(): PayrollReviewDraft | null {
  if (typeof window === 'undefined') return null;

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

  const [draft] = useState<PayrollReviewDraft | null>(() => readDraftFromSession());
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedPayrollResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

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
    validation.hasPayees &&
    validation.allWalletsValid &&
    validation.allAmountsValid &&
    !generatedResult;

  async function handleGenerateProof() {
    if (!draft || generatedResult) return;

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to generate payroll');
      }

      setGeneratedResult(result);
      sessionStorage.setItem('zetapayGeneratedPayroll', JSON.stringify(result));

      if (result.verificationUrl) {
        window.open(result.verificationUrl, '_blank');
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
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
            onClick={() => router.push(`${ROUTES.employer.root}/payroll/new`)}
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
        backLink={{ href: `${ROUTES.employer.root}/payroll/new`, label: 'Back to Builder' }}
      />

      <PayrollReviewHeader draft={draft} />

      {generationError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {generationError}
        </div>
      )}

      {generatedResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Payroll #{generatedResult.payrollRunId} generated
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  Commitments, Merkle root, proof placeholder, and verification token were saved.
                </p>
              </div>
            </div>

            {generatedResult.verificationUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(generatedResult.verificationUrl, '_blank')}
                className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open verification
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <PayrollReviewTable items={draft.items} />

          <PayrollReviewActions
            canGenerate={canGenerate}
            generating={generating}
            generated={Boolean(generatedResult)}
            onBack={() => router.push(`${ROUTES.employer.root}/payroll/new`)}
            onGenerate={handleGenerateProof}
          />
        </div>

        <PayrollReviewValidationCard validation={validation} />
      </div>
    </div>
  );
}
