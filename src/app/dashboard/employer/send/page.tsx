'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Wallet, CheckCircle, Clock, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROUTES, API } from '@/config';
import Cookies from 'js-cookie';
import type { Person } from '@/types/person';

export default function SendPayment() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletBalance] = useState(24500);

  const fetchPeople = useCallback(async () => {
    const enterpriseId = Cookies.get('enterpriseId');
    if (!enterpriseId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API.employees.byEnterprise(parseInt(enterpriseId)));
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectedPerson = people.find((p) => p.id === selectedId);

  const handleSend = async () => {
    if (!selectedPerson || !amount || parseFloat(amount) <= 0) return;
    setIsSending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setShowSuccess(true);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const triggerFetch = async () => {
      await Promise.resolve();
      if (isMounted) {
        await fetchPeople();
      }
    };

    triggerFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchPeople]);

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/50 p-12 text-center">
        <div className="rounded-full bg-emerald-100 p-4">
          <CheckCircle className="h-12 w-12 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Payment Sent Successfully!</h2>
        <p className="mt-2 text-slate-500">
          {selectedPerson?.name} • ${parseFloat(amount).toFixed(2)} USDC
        </p>
        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => {
              setShowSuccess(false);
              setSelectedId(null);
              setAmount('');
              router.refresh();
            }}
          >
            Send Another
          </Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.employer.employees)}>
            View People
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Payment"
        description="Send USDC to any recipient instantly"
        backLink={{ href: ROUTES.employer.employees, label: 'Back to People' }}
        action={
          <Button
            onClick={handleSend}
            loading={isSending}
            disabled={!selectedId || !amount || parseFloat(amount) <= 0}
            icon={<Send className="h-4 w-4" />}
          >
            Send ${amount || '0'}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Available Balance</p>
              <p className="text-2xl font-bold text-slate-900">${walletBalance.toFixed(2)}</p>
              <p className="text-xs text-slate-400">USDC on Stellar</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Network</p>
          <p className="text-lg font-semibold text-slate-900">Stellar Testnet</p>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Connected
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">ZK Privacy</p>
          <p className="flex items-center gap-2 text-lg font-semibold text-emerald-600">
            <Shield className="h-5 w-5" /> Enabled
          </p>
          <p className="text-xs text-slate-400">Amounts masked on-chain</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-semibold text-slate-900">Select Recipient</label>
        {loading ? (
          <div className="mt-4 text-center text-slate-500">Loading...</div>
        ) : people.length === 0 ? (
          <div className="mt-4 text-center text-slate-500">
            No recipients found. Add people first.
          </div>
        ) : (
          <div className="mt-2 grid gap-2">
            {people.map((person) => (
              <button
                key={person.id}
                onClick={() => setSelectedId(person.id)}
                className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                  selectedId === person.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {person.name?.charAt(0) || '?'}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{person.name}</p>
                    <p className="font-mono text-xs text-slate-500">{person.wallet}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    person.type === 'employee'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {person.type || 'person'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPerson && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
          <label className="block text-sm font-semibold text-slate-900">Amount (USDC)</label>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative flex-1">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="w-full rounded-xl border border-slate-200 py-3 pr-4 pl-8 text-xl font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rand = Math.floor(Math.random() * 900 + 100);
                setAmount(rand.toString());
              }}
            >
              Random
            </Button>
          </div>
          {parseFloat(amount) > walletBalance && (
            <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> Insufficient balance
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3 w-3" /> ~2 seconds settlement
            <span className="text-slate-300">•</span>
            <span>Fee: ~$0.001</span>
          </div>
        </div>
      )}
    </div>
  );
}
