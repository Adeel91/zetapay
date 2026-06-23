'use client';

import { useState } from 'react';
import { Upload, Wallet, Send, Users, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function EmployerPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const employees = [
    { id: 1, name: 'Alice Johnson', wallet: 'G...1234', salary: 5000 },
    { id: 2, name: 'Bob Smith', wallet: 'G...5678', salary: 6500 },
    { id: 3, name: 'Carol Davis', wallet: 'G...9012', salary: 4800 },
  ];

  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploaded(true);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employer Dashboard</h1>
            <p className="text-slate-500">Run payroll with zero-knowledge privacy</p>
          </div>
          <Button
            variant={isConnected ? 'secondary' : 'primary'}
            icon={<Wallet className="h-4 w-4" />}
            onClick={() => setIsConnected(!isConnected)}
          >
            {isConnected ? 'Connected' : 'Connect Wallet'}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="h-4 w-4" />
              <span className="text-sm">Employees</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{employees.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Payroll</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              ${totalPayroll.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Send className="h-4 w-4" />
              <span className="text-sm">Status</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-600">Ready</p>
          </div>
        </div>

        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            uploaded
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-slate-200 bg-white hover:border-emerald-500'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            {uploaded ? (
              <>
                <CheckCircle className="h-12 w-12 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-semibold text-emerald-600">Upload Successful!</h3>
                  <p className="text-sm text-slate-500">3 employees loaded</p>
                </div>
                <Button variant="ghost" onClick={() => setUploaded(false)}>
                  Upload another file
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-full bg-emerald-50 p-4">
                  <Upload className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Upload Payroll CSV</h3>
                  <p className="text-sm text-slate-500">Drag and drop or click to upload</p>
                </div>
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </Button>
                <p className="text-xs text-slate-500">CSV format: Name, Wallet Address, Salary</p>
              </>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Wallet
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                    Salary
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                    Net Pay
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.map((emp) => (
                  <tr key={emp.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{emp.name}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-500">{emp.wallet}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      ${emp.salary.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">
                      ${(emp.salary * 0.7).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full bg-emerald-600 shadow-lg shadow-emerald-600/30 hover:bg-emerald-700"
          icon={<Send className="h-4 w-4" />}
        >
          Execute Shielded Payout
        </Button>

        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span>
            System ready • {employees.length} employees loaded • Total: $
            {totalPayroll.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
