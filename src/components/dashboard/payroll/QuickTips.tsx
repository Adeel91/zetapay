'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function QuickTips() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Quick Tips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p>• Ensure the recipient's wallet is active</p>
        <p>• Minimum transaction: 0.01 XLM</p>
        <p>• Transactions typically take 3-5 seconds</p>
        <p>• Add a memo for easy reference</p>
      </CardContent>
    </Card>
  );
}
