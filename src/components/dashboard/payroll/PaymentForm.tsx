'use client';

import { useState } from 'react';
import { Send, AlertCircle, Shield, ShieldOff, Lock, EyeOff, Sparkles, Coins } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PersonSearchSelect } from './PersonSearchSelect';
import { PersonInfoCard } from './PersonInfoCard';
import { Person } from '@/types/person';
import { PaymentFormData, BalanceData } from '@/types/payroll';

interface PaymentFormProps {
  people: Person[];
  selectedPerson: Person | null;
  formData: PaymentFormData;
  balance: BalanceData | null;
  balanceLoading: boolean;
  balanceError: string | null;
  submitting: boolean;
  error: string | null;
  onPersonSelect: (id: string) => void;
  onFormChange: (data: Partial<PaymentFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCopyWallet: (address: string) => void;
}

export function PaymentForm({
  people,
  selectedPerson,
  formData,
  balance,
  submitting,
  error,
  onPersonSelect,
  onFormChange,
  onSubmit,
  onCopyWallet,
}: PaymentFormProps) {
  const [isPrivate, setIsPrivate] = useState(true);
  const [amountFocused, setAmountFocused] = useState(false);

  const getAvailableBalance = () => {
    if (!balance) return '0.00';
    return formData.currency === 'XLM'
      ? parseFloat(balance.xlm || '0').toFixed(4)
      : parseFloat(balance.usdc || '0').toFixed(2);
  };

  const getBalanceSymbol = () => {
    return formData.currency === 'XLM' ? 'XLM' : 'USDC';
  };

  const maxAmount = parseFloat(getAvailableBalance());

  return (
    <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-slate-200/50">
      <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="relative flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">Send Payment</h3>
            <p className="mt-0.5 text-sm text-emerald-100/80">Transfer funds securely on Stellar</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                  isPrivate ? 'bg-white/30' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                    isPrivate ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {isPrivate ? (
                <>
                  <Shield className="h-4 w-4 text-emerald-200" />
                  <span className="text-xs font-semibold text-white">Private</span>
                </>
              ) : (
                <>
                  <ShieldOff className="h-4 w-4 text-emerald-200/50" />
                  <span className="text-xs font-medium text-emerald-200/50">Public</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          {isPrivate && (
            <div className="relative mt-5 overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50/90 to-emerald-100/40 p-3.5">
              <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-emerald-200/30 blur-xl" />
              <div className="relative flex items-start gap-3">
                <div className="rounded-full bg-emerald-100 p-1.5 shadow-sm">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">Private Transfer</p>
                  <p className="text-xs text-emerald-600/80">
                    Shielded with zk-SNARKs. Only you and the recipient know the details.
                  </p>
                </div>
                <Sparkles className="absolute top-1 right-1 h-3 w-3 text-emerald-400/50" />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Recipient</label>
            <PersonSearchSelect
              people={people}
              selectedId={formData.personId}
              onSelect={onPersonSelect}
              placeholder="Search by name or email..."
            />
          </div>

          {selectedPerson && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <PersonInfoCard person={selectedPerson} onCopyWallet={onCopyWallet} />
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Amount</label>
              {balance && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Coins className="h-3 w-3" />
                  <span>
                    {getAvailableBalance()} {getBalanceSymbol()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <div
                className={`relative flex-1 rounded-xl border-2 transition-all ${amountFocused ? 'border-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' : 'border-slate-200'}`}
              >
                {formData.currency === 'USDC' && (
                  <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium text-slate-400">
                    $
                  </span>
                )}
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxAmount || undefined}
                  value={formData.amount}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  onChange={(e) => onFormChange({ amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-transparent px-3.5 py-3 text-base outline-none"
                  style={{
                    paddingLeft: formData.currency === 'USDC' ? '2rem' : '1rem',
                  }}
                  required
                />
                <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-sm font-medium text-slate-400">
                  {formData.currency}
                </span>
              </div>

              <div className="relative min-w-[110px]">
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    onFormChange({
                      currency: e.target.value as 'XLM' | 'USDC',
                      amount: '',
                    })
                  }
                  className="h-full w-full rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 pr-9 text-sm font-medium transition-all outline-none focus:border-emerald-400 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)]"
                >
                  <option value="XLM">XLM</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
            </div>

            {maxAmount > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onFormChange({ amount: ((maxAmount * pct) / 100).toFixed(4) })}
                    className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-all hover:bg-emerald-100 hover:text-emerald-700"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isPrivate ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Memo <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.memo}
                onChange={(e) => onFormChange({ memo: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all outline-none focus:border-emerald-400 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)]"
                placeholder="Add a reference..."
                maxLength={200}
              />
              <div className="mt-1 text-right text-xs text-slate-400">
                {formData.memo.length}/200
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
              <EyeOff className="h-4 w-4 text-slate-400" />
              <span>Memo hidden for private transfer</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50/80 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-4 text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Stellar
              </span>
              <span>Fee: ~0.00001 XLM</span>
              {isPrivate && (
                <span className="flex items-center gap-1 font-medium text-emerald-600">
                  <Shield className="h-3 w-3" />
                  Shielded
                </span>
              )}
            </div>
            {balance && (
              <span className="font-medium text-slate-700">
                {getAvailableBalance()} {getBalanceSymbol()}
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-600/35 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            disabled={
              !selectedPerson ||
              !formData.amount ||
              submitting ||
              parseFloat(formData.amount) > maxAmount
            }
          >
            {submitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : isPrivate ? (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Send Privately
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Payment
              </>
            )}
          </Button>

          <p className="text-center text-xs text-slate-400">
            {isPrivate
              ? '🔒 Private transactions are secured with zero-knowledge proofs'
              : 'Transactions are recorded on the public Stellar ledger'}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
