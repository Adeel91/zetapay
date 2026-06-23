'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AUDITOR, AUTH, ROUTES } from '@/config';
import { useWallet } from '@/app/providers';
import Cookies from 'js-cookie';

export default function AuditorLoginForm() {
  const router = useRouter();
  const { refreshUser } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [auditKey, setAuditKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !auditKey) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Cookies.set('zetaRole', AUDITOR, { expires: 7, path: '/' });
      Cookies.set(
        'auditorSession',
        JSON.stringify({
          email,
          loggedInAt: new Date().toISOString(),
        }),
        { expires: 7, path: '/' }
      );

      refreshUser(email);
      router.push(ROUTES.auditor.root);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <button
          onClick={() => router.push(AUTH)}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <Shield className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Auditor Login</h1>
          <p className="mt-2 text-slate-500">Enter your credentials to verify payroll</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="auditor@company.com"
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-12 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Audit Key</label>
            <div className="relative mt-1">
              <Shield className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={auditKey}
                onChange={(e) => setAuditKey(e.target.value)}
                placeholder="Enter audit key from employer"
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              The audit key is provided by the employer for verification
            </p>
          </div>

          <Button
            type="submit"
            loading={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            icon={<Shield className="h-4 w-4" />}
          >
            Verify & Login
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push(ROUTES.auth.auditorSignup)}
              className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Don’t have an account? Sign up
            </button>
          </div>

          <p className="text-center text-xs text-slate-400">
            Secure auditor access with audit key verification
          </p>
        </form>
      </div>
    </div>
  );
}
