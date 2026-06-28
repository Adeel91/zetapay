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
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
        {generating ? 'Generating proof...' : generated ? 'Proof generated' : 'Generate ZK payroll'}
      </Button>
    </div>
  );
}
