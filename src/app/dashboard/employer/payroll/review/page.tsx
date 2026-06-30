'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileWarning, Loader2, ShieldCheck, WalletCards } from 'lucide-react';

import { ROUTES } from '@/config';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PayrollReviewHeader } from '@/components/dashboard/payroll/review/PayrollReviewHeader';
import { PayrollReviewTable } from '@/components/dashboard/payroll/review/PayrollReviewTable';
import { PayrollReviewValidationCard } from '@/components/dashboard/payroll/review/PayrollReviewValidationCard';
import { PayrollReviewActions } from '@/components/dashboard/payroll/review/PayrollReviewActions';
import { PayrollReviewDraft } from '@/components/dashboard/payroll/review/types';
import { getFreighterPublicKey, signWithFreighter } from '@/lib/stellar/freighter';

type PreparePayrollResult = {
  success: boolean;
  step: 'prepared';
  payrollRunId: number;
  employer: string;
  initializeXdr?: string | null;
  submitXdr?: string | null;
  batchRoot: string;
  payrollRunHash: string;
  proofHash: string;
  totals: {
    xlm: number;
    usdc: number;
    payeeCount: number;
    batchCount: number;
  };
};

type InitializePayrollResult = {
  success: boolean;
  step: 'initialized';
  payrollRunId: number;
  employer: string;
  initializeTxHash?: string | null;
  submitXdr: string;
};

type ExecutePayrollResult = {
  success: boolean;
  step: 'executed';
  payrollRunId: number;
  status: string;
  batchRoot: string;
  payrollRunHash: string;
  proofHash: string;
  txHash?: string | null;
  submitTxHash?: string | null;
  executeTxHash?: string | null;
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

const progressSteps = [
  'Preparing private payroll commitments',
  'Generating Groth16 proof',
  'Initializing employer contract state',
  'Signing payroll transaction with Freighter',
  'Saving audit and verification records',
];

function readDraftFromSession(): PayrollReviewDraft | null {
  const raw = window.sessionStorage.getItem('zetapayPayrollDraft');

  if (!raw) return null;

  try {
    return JSON.parse(raw) as PayrollReviewDraft;
  } catch {
    return null;
  }
}

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & PayrollErrorResponse;

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Request failed');
  }

  return result;
}

export default function PayrollReviewPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<PayrollReviewDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      setDraft(readDraftFromSession());
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!generating) return;

    const timer = window.setInterval(() => {
      setProgressIndex((current) => Math.min(current + 1, progressSteps.length - 1));
    }, 3000);

    return () => window.clearInterval(timer);
  }, [generating]);

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
    setProgressIndex(0);

    try {
      const walletAddress = await getFreighterPublicKey();

      setProgressIndex(1);

      const prepareResponse = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare',
          walletAddress,
          periodStart: draft.periodStart,
          periodEnd: draft.periodEnd,
          items: draft.items.map((item) => ({
            personId: item.personId,
            amount: item.amount,
            currency: item.currency,
          })),
        }),
      });

      const prepared = await readJsonOrThrow<PreparePayrollResult>(prepareResponse);

      if (prepared.employer !== walletAddress) {
        throw new Error('Connected wallet does not match this enterprise wallet.');
      }

      let submitXdr = prepared.submitXdr;

      setProgressIndex(2);

      if (prepared.initializeXdr) {
        const signedInitializeXdr = await signWithFreighter(prepared.initializeXdr, walletAddress);

        const initializeResponse = await fetch('/api/payroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submitInitialize',
            walletAddress,
            payrollRunId: prepared.payrollRunId,
            signedXdr: signedInitializeXdr,
          }),
        });

        const initialized = await readJsonOrThrow<InitializePayrollResult>(initializeResponse);
        submitXdr = initialized.submitXdr;
      }

      if (!submitXdr) {
        throw new Error('Payroll transaction was not prepared.');
      }

      setProgressIndex(3);

      const signedSubmitXdr = await signWithFreighter(submitXdr, walletAddress);

      const submitResponse = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitSigned',
          walletAddress,
          payrollRunId: prepared.payrollRunId,
          signedXdr: signedSubmitXdr,
        }),
      });

      const executed = await readJsonOrThrow<ExecutePayrollResult>(submitResponse);

      setProgressIndex(progressSteps.length - 1);

      window.sessionStorage.setItem('zetapayGeneratedPayroll', JSON.stringify(executed));
      window.sessionStorage.removeItem('zetapayPayrollDraft');

      router.push(ROUTES.employer.payrollDetails(String(executed.payrollRunId)));
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate payroll');
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
    <>
      {generating && <PayrollProgressOverlay currentStep={progressIndex} />}

      <div className="space-y-6">
        <PageHeader
          title="Payroll Review"
          description="Confirm payroll details before generating the proof and executing payroll on Stellar."
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
    </>
  );
}

function PayrollProgressOverlay({ currentStep }: { currentStep: number }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-7 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold">Executing ZetaPay payroll</h2>
              <p className="mt-1 text-sm text-emerald-50/80">
                Generating proof, signing with Freighter, and sending payroll.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">{progressSteps[currentStep]}</p>
              <p className="text-xs text-emerald-700/70">
                Freighter will ask you to approve the Stellar transaction.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {progressSteps.map((step, index) => {
              const complete = index < currentStep;
              const active = index === currentStep;

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                    active
                      ? 'border-emerald-200 bg-emerald-50'
                      : complete
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      complete
                        ? 'bg-emerald-600 text-white'
                        : active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {complete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>

                  <span
                    className={`text-sm ${
                      active || complete ? 'font-semibold text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
            <WalletCards className="h-4 w-4 text-slate-400" />
            Keep this window open while payroll is being executed.
          </div>
        </div>
      </div>
    </div>
  );
}
