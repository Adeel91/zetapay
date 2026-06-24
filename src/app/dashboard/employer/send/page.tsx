'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Send as SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PaymentForm } from '@/components/dashboard/payroll/PaymentForm';
import { WalletBalanceCard } from '@/components/dashboard/payroll/WalletBalanceCard';
import { QuickTips } from '@/components/dashboard/payroll/QuickTips';
import { RecentRecipients } from '@/components/dashboard/payroll/RecentRecipients';
import { API, ROUTES } from '@/config';
import Cookies from 'js-cookie';
import { Person } from '@/types/person';
import { PaymentFormData, BalanceData } from '@/types/payroll';
import { mapApiRecordToPerson } from '@/types/person';

interface ApiRecord {
  id: string | number;
  fullName?: string | null;
  name?: string | null;
  walletAddress?: string | null;
  wallet?: string | null;
  email?: string | null;
  type?: string | null;
  title?: string | null;
  salary?: string | number | null;
  status?: string | null;
  verified?: boolean | null;
  createdAt?: string | null;
}

export default function SendPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientId = searchParams.get('recipient');

  const [people, setPeople] = useState<Person[]>([]);
  const [manuallySelectedPerson, setManuallySelectedPerson] = useState<Person | null>(null);
  const [hasManuallySelected, setHasManuallySelected] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    personId: '',
    amount: '',
    currency: 'XLM',
    memo: '',
  });

  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  let selectedPerson = manuallySelectedPerson;
  if (!hasManuallySelected && recipientId && people.length > 0) {
    const urlPerson = people.find((p) => p.id === recipientId);
    if (urlPerson) {
      selectedPerson = urlPerson;
    }
  }

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalanceError(null);

    try {
      const response = await fetch(API.stellar.balance);

      if (response.status === 401) {
        const errorData = await response.json();
        setBalanceError(errorData.message || 'Please connect your wallet to view balance');
        setBalance(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      setBalance(data);
      setBalanceError(null);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setBalanceError('Unable to load balance');
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const fetchPeople = useCallback(async () => {
    const enterpriseId = Cookies.get('enterpriseId');
    if (!enterpriseId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API.employees.byEnterprise(parseInt(enterpriseId)));

      if (!response.ok) {
        throw new Error('Failed to fetch people');
      }

      const data: ApiRecord[] = await response.json();
      const mappedPeople = data.map((record: ApiRecord) => mapApiRecordToPerson(record));
      setPeople(mappedPeople);

      if (recipientId) {
        const urlPerson = mappedPeople.find((p) => p.id === recipientId);
        if (urlPerson) {
          setFormData((prev) => ({
            ...prev,
            personId: urlPerson.id,
            amount: urlPerson.salary ? urlPerson.salary.toString() : prev.amount,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching people:', err);
      setError('Failed to load people');
    } finally {
      setLoading(false);
    }
  }, [recipientId]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (!isMounted) return;
      await Promise.all([fetchPeople(), fetchBalance()]);
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchPeople, fetchBalance]);

  const handlePersonSelect = (personId: string) => {
    setHasManuallySelected(true);
    const person = people.find((p) => p.id === personId);

    if (person) {
      setManuallySelectedPerson(person);
      setFormData((prev) => ({
        ...prev,
        personId: person.id,
        amount: person.salary ? person.salary.toString() : '',
      }));
      setError(null);
    } else {
      setManuallySelectedPerson(null);
      setFormData((prev) => ({ ...prev, personId: '', amount: '' }));
    }
  };

  const handleFormChange = (data: Partial<PaymentFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!selectedPerson?.wallet) {
        throw new Error('Recipient has no wallet address set');
      }

      const response = await fetch(API.stellar.send, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: selectedPerson.wallet,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          memo: formData.memo || `Payment to ${selectedPerson.name}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      setSuccess(true);
      await fetchBalance();

      setTimeout(() => {
        setSuccess(false);
        setFormData((prev) => ({ ...prev, amount: '', memo: '' }));
        setManuallySelectedPerson(null);
        setHasManuallySelected(false);
        router.push(ROUTES.employer.employees);
      }, 3000);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <div className="rounded-full bg-emerald-50 p-4">
          <CheckCircle className="h-16 w-16 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-slate-900">Payment Sent! 🎉</h3>
        <p className="mt-2 text-slate-500">
          {formData.amount} {formData.currency} sent to {selectedPerson?.name}
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => router.push(ROUTES.employer.employees)}>
            Back to People
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => router.push(ROUTES.employer.send)}
          >
            Send Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Payment"
        description="Pay employees, contractors, or freelancers securely"
        backLink={{ href: ROUTES.employer.employees, label: 'Back to People' }}
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
            <SendIcon className="h-4 w-4 text-emerald-600" />
          </div>
          <span>Powered by Stellar Network</span>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PaymentForm
            people={people}
            selectedPerson={selectedPerson}
            formData={formData}
            balance={balance}
            balanceLoading={balanceLoading}
            balanceError={balanceError}
            submitting={submitting}
            error={error}
            onPersonSelect={handlePersonSelect}
            onFormChange={handleFormChange}
            onSubmit={handleSubmit}
            onCopyWallet={copyToClipboard}
          />
        </div>

        <div className="space-y-6">
          <WalletBalanceCard
            balance={balance}
            loading={balanceLoading}
            error={balanceError}
            onRefresh={fetchBalance}
          />
          <QuickTips />
          <RecentRecipients people={people} onSelect={handlePersonSelect} />
        </div>
      </div>
    </div>
  );
}
