'use client';

import { useState } from 'react';
import { Shield, Download, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AuditorPage() {
  const [auditKey, setAuditKey] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = () => {
    if (!auditKey.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsVerified(true);
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Auditor Portal</h1>
          <p className="text-slate-500">View decrypted payroll data with your audit key</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <label className="block text-sm font-semibold text-slate-900">Auditor Viewing Key</label>
          <p className="mt-1 text-xs text-slate-500">
            Enter the unique key provided by the employer
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              value={auditKey}
              onChange={(e) => {
                setAuditKey(e.target.value);
                if (isVerified) setIsVerified(false);
              }}
              placeholder="Paste your audit key here..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
            <Button onClick={handleVerify} disabled={!auditKey.trim() || isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Key'}
            </Button>
          </div>
          {auditKey && !isVerified && (
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              Enter the key to decrypt payroll data
            </p>
          )}
        </div>

        {isVerified && (
          <div className="animate-fade-up">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-700">Decrypted Payroll Data</span>
                    <p className="text-xs text-slate-500">
                      Viewing key verified • Payroll #PAY-2026-001
                    </p>
                  </div>
                </div>
                <Button variant="outline" icon={<Download className="h-4 w-4" />}>
                  Export CSV
                </Button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                        Wallet
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                        Gross
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                        Net
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                        Tax
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-900">Alice Johnson</td>
                      <td className="px-4 py-3 font-mono text-slate-500">G...1234</td>
                      <td className="px-4 py-3 text-right text-slate-700">$5,000.00</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        $3,500.00
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">$1,500.00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-900">Bob Smith</td>
                      <td className="px-4 py-3 font-mono text-slate-500">G...5678</td>
                      <td className="px-4 py-3 text-right text-slate-700">$6,500.00</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        $4,550.00
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">$1,950.00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-900">Carol Davis</td>
                      <td className="px-4 py-3 font-mono text-slate-500">G...9012</td>
                      <td className="px-4 py-3 text-right text-slate-700">$4,800.00</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        $3,360.00
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">$1,440.00</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold">
                    <tr>
                      <td className="px-4 py-3 text-slate-900">Total</td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right text-slate-900">$16,300.00</td>
                      <td className="px-4 py-3 text-right text-emerald-600">$11,410.00</td>
                      <td className="px-4 py-3 text-right text-slate-500">$4,890.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                  Data decrypted successfully
                </span>
                <span>•</span>
                <span>Audit log recorded</span>
                <span>•</span>
                <span>
                  Key: {auditKey.slice(0, 8)}...{auditKey.slice(-8)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
