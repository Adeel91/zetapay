import { Card, CardContent } from '@/components/ui/Card';

export function PayrollNextStepsCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold text-slate-900">What happens next?</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>1. ZetaPay creates one private commitment per payee.</p>
          <p>2. A Merkle root commits to the full payroll batch.</p>
          <p>3. A Groth16 proof verifies totals without exposing salaries.</p>
          <p>4. Employees can later verify their own payment privately.</p>
        </div>
      </CardContent>
    </Card>
  );
}
