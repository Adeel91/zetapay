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
import { ZetaPayProver, EmployeeInput } from '@/lib/zk/prover';
import type { FullProofResult } from '@/lib/zk/prover';

interface ApiRecord {
  id: string | number;
  fullName?: string | null;
  name?: string | null;
  walletAddress?: string | null;
  wallet?: string | null;
  email?: string | null;
  type?: string | null;
  title?: string | null;
  salaryUSDC?: string | number | null;
  salaryXLM?: string | number | null;
  salary?: string | number | null;
  status?: string | null;
  verified?: boolean | null;
  createdAt?: string | null;
}

function generateSalt(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}

/** Convert raw proof bytes to a lowercase hex string for JSON transport. */
function proofToHex(proof: Uint8Array): string {
  return Array.from(proof, (b) => b.toString(16).padStart(2, '0')).join('');
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
  const [generatingProof, setGeneratingProof] = useState(false);
  const [circuitLoading, setCircuitLoading] = useState(true);
  const [circuitReady, setCircuitReady] = useState(false);
  const [circuitError, setCircuitError] = useState<string | null>(null);
  const [zkProof, setZkProof] = useState<FullProofResult | null>(null);

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
          let defaultAmount = '';
          let defaultCurrency: 'USDC' | 'XLM' = 'USDC';

          if (urlPerson.salaryUSDC && urlPerson.salaryUSDC > 0) {
            defaultAmount = urlPerson.salaryUSDC.toString();
            defaultCurrency = 'USDC';
          } else if (urlPerson.salaryXLM && urlPerson.salaryXLM > 0) {
            defaultAmount = urlPerson.salaryXLM.toString();
            defaultCurrency = 'XLM';
          }

          setFormData((prev) => ({
            ...prev,
            personId: urlPerson.id,
            amount: defaultAmount,
            currency: defaultCurrency,
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

    const preloadCircuit = async () => {
      setCircuitLoading(true);
      setCircuitError(null);

      try {
        await ZetaPayProver.preloadCircuit();
        if (isMounted) {
          setCircuitReady(true);
        }
      } catch (err) {
        console.error('Failed to load payroll circuit:', err);
        if (isMounted) {
          setCircuitError(err instanceof Error ? err.message : 'Failed to load ZK payroll circuit');
          setCircuitReady(false);
        }
      } finally {
        if (isMounted) {
          setCircuitLoading(false);
        }
      }
    };

    preloadCircuit();

    return () => {
      isMounted = false;
    };
  }, []);

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
      let defaultAmount = '';
      let defaultCurrency: 'USDC' | 'XLM' = 'USDC';

      if (person.salaryUSDC && person.salaryUSDC > 0) {
        defaultAmount = person.salaryUSDC.toString();
        defaultCurrency = 'USDC';
      } else if (person.salaryXLM && person.salaryXLM > 0) {
        defaultAmount = person.salaryXLM.toString();
        defaultCurrency = 'XLM';
      }

      setManuallySelectedPerson(person);
      setFormData((prev) => ({
        ...prev,
        personId: person.id,
        amount: defaultAmount,
        currency: defaultCurrency,
      }));
      setError(null);
      setZkProof(null);
    } else {
      setManuallySelectedPerson(null);
      setFormData((prev) => ({ ...prev, personId: '', amount: '' }));
      setZkProof(null);
    }
  };

  const handleFormChange = (data: Partial<PaymentFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setZkProof(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateZKProof = async (): Promise<FullProofResult> => {
    if (!circuitReady) {
      throw new Error(
        circuitError || 'Payroll circuit is still loading. Please wait a moment and try again.'
      );
    }

    if (!selectedPerson) {
      throw new Error('Please select a recipient employee first.');
    }

    if (
      !formData.amount ||
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      throw new Error('Please provide a valid transaction amount.');
    }

    setGeneratingProof(true);
    setError(null);

    try {
      const targetEmployeeId = BigInt(selectedPerson.id);
      const targetSalary     = BigInt(Math.floor(parseFloat(formData.amount)));
      const randomSalt       = BigInt(generateSalt());

      const activeEmployees: EmployeeInput[] = [
        { id: targetEmployeeId, salary: targetSalary, salt: randomSalt },
      ];

      console.log('⚡ Running prover...', {
        id:     targetEmployeeId.toString(),
        salary: targetSalary.toString(),
        salt:   randomSalt.toString(),
      });

      const proofResult = await ZetaPayProver.generatePayrollProof(activeEmployees);

      console.log('✅ Cryptographic proof compiled successfully!');

      setZkProof(proofResult);
      return proofResult;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown prover error';
      console.error('❌ Prover failure:', err);
      throw new Error(msg);
    } finally {
      setGeneratingProof(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!selectedPerson?.wallet) {
        throw new Error('Recipient has no wallet address set.');
      }

      // Generate proof on first submit; reuse cached result on retry.
      let proofResult: FullProofResult;
      try {
        proofResult = zkProof ?? (await generateZKProof());
      } catch (err) {
        throw new Error(
          'Failed to generate ZK proof: ' + (err instanceof Error ? err.message : 'Unknown error')
        );
      }

      if (!proofResult?.proof?.length) {
        throw new Error('Proof generation returned empty output.');
      }

      const { circuitInputs } = proofResult;
      const payoutAmount      = Math.floor(parseFloat(formData.amount));

      // ── Build the exact payload shape the API route expects ────────────────
      const payload = {
        // Hex-encoded proof bytes
        proof: proofToHex(proofResult.proof),

        // BN254 Fr commitment per active employee (from public circuit outputs)
        publicInputs: circuitInputs.commitments.slice(0, 1),

        // The Poseidon2 Merkle root shared by all employees in this batch
        merkleRoot: circuitInputs.merkle_roots[0] ?? ('0x' + '0'.repeat(64)),

        // Sum of all payout amounts (micro-token units)
        totalAmount: Number(circuitInputs.total_amount),

        periodStart: Math.floor(Date.now() / 1000),
        periodEnd:   Math.floor(Date.now() / 1000) + 2_592_000, // +30 days

        // One entry per employee with all Soroban contract fields
        employees: [{
          employeeId:       parseInt(selectedPerson.id),
          address:          selectedPerson.wallet,
          payoutAmount,
          salaryCommitment: circuitInputs.commitments[0],
          merkleProof:      circuitInputs.merkle_proofs[0],
          merkleIndex:      0,
        }],
      };

      console.log('🚀 Sending payroll payload to server...');

      const response = await fetch(API.stellar.send, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment transaction rejected by processor server.');
      }

      setSuccess(true);
      await fetchBalance();

      setTimeout(() => {
        setSuccess(false);
        setFormData((prev) => ({ ...prev, amount: '', memo: '' }));
        setManuallySelectedPerson(null);
        setHasManuallySelected(false);
        setZkProof(null);
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
        {zkProof && (
          <p className="mt-1 text-xs text-slate-400">🔒 ZK Proof Generated and Verified</p>
        )}
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
            submitting={submitting || generatingProof || circuitLoading}
            error={error || circuitError}
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
