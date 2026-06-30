import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PayrollReviewActions({
  canGenerate,
  generating,
  generated,
  onBack,
  onGenerate,
}: {
  canGenerate: boolean;
  generating: boolean;
  generated: boolean;
  onBack: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" type="button" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to builder
        </Button>

        <Button
          type="button"
          disabled={!canGenerate || generating || generated}
          onClick={onGenerate}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          {generating
            ? 'Generating proof and sending payroll...'
            : generated
              ? 'Payroll completed'
              : 'Generate ZK Payroll'}
        </Button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        This will generate the Groth16 proof, submit the payroll batch to Stellar, execute payouts,
        and save verification links for employees and auditors.
      </p>
    </div>
  );
}
