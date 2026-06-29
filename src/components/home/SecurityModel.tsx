'use client';

import { useEffect, useRef, useState } from 'react';
import { Binary, Database, FileLock2, GitCommitHorizontal, KeyRound, Lock } from 'lucide-react';

const security = [
  {
    icon: FileLock2,
    title: 'No plaintext verification tokens',
    text: 'Stored token values include a SHA256 token hash and an AES256 encrypted payload.',
  },
  {
    icon: KeyRound,
    title: 'Payroll specific audit keys',
    text: 'Each payroll receives a unique audit key that unlocks only the authorized report.',
  },
  {
    icon: GitCommitHorizontal,
    title: 'Merkle payment commitments',
    text: 'Employee payment records become commitments with Merkle paths and path indices.',
  },
  {
    icon: Binary,
    title: 'Proof generation boundary',
    text: 'Current proofs are represented by placeholders while real Groth16 generation is the next milestone.',
  },
];

const tables = [
  'enterprises',
  'employees',
  'users',
  'payroll_runs',
  'payroll_employees',
  'payroll_verification_links',
  'audit_logs',
  'audit_keys',
  'zk_proofs',
  'payroll_settings',
  'transaction_logs',
];

export function SecurityModel() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-slate-50 py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.14),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-start">
          <div
            className="lg:col-span-5"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 800ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <p className="text-sm font-bold tracking-[0.26em] text-emerald-600 uppercase">
              Security model
            </p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Designed around selective disclosure.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              ZetaPay splits payroll data into commitments, encrypted verification payloads, audit
              keys, and public proof metadata. Nobody receives more information than their role
              requires.
            </p>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-950 p-3 text-emerald-300">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950">Database coverage</h3>
                  <p className="text-sm text-slate-500">Current project tables</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {tables.map((table) => (
                  <span
                    key={table}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs text-slate-600"
                  >
                    {table}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:col-span-7">
            {security.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 transition duration-500 hover:-translate-y-1"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                    transition: `all 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 100}ms`,
                  }}
                >
                  <div className="mb-6 inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              );
            })}

            <div className="rounded-3xl border border-slate-900 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300 md:col-span-2">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-4 inline-flex rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Example audit key format</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Audit access is scoped to one payroll report.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-mono text-lg font-bold text-emerald-200">
                  AUD 3A91 8C27 FE19 0B5D
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
