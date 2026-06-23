'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Shield, ArrowLeft, Eye, EyeOff, UserPlus, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AUDITOR, AUTH, ROUTES } from '@/config';
import { useWallet } from '@/app/providers';
import Cookies from 'js-cookie';

export default function AuditorSignupForm() {
  const router = useRouter();
  const { refreshUser } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    auditKey: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Cookies.set('zetaRole', AUDITOR, { expires: 7, path: '/' });
      Cookies.set(
        'auditorSession',
        JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          loggedInAt: new Date().toISOString(),
        }),
        { expires: 7, path: '/' }
      );

      refreshUser(formData.email);
      router.push(ROUTES.auditor.root);
    } catch (error) {
      console.error('Signup failed:', error);
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
            <UserPlus className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Auditor Sign Up</h1>
          <p className="mt-2 text-slate-500">Create your auditor account to verify payroll</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <div className="relative mt-1">
              <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
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
            <p className="mt-1 text-xs text-slate-400">Must be at least 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
            <div className="relative mt-1">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-xl border py-2.5 pr-12 pl-10 focus:ring-2 focus:outline-none ${
                  passwordError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Audit Key</label>
            <div className="relative mt-1">
              <Shield className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="auditKey"
                required
                value={formData.auditKey}
                onChange={handleChange}
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
            icon={<UserPlus className="h-4 w-4" />}
          >
            Create Account
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push(ROUTES.auth.auditorLogin)}
              className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Already have an account? Log in
            </button>
          </div>

          <p className="text-center text-xs text-slate-400">
            By signing up, you agree to our Terms of Service
          </p>
        </form>
      </div>
    </div>
  );
}
