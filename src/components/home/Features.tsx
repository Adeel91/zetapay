'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Eye,
  FileSearch,
  Link2,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Employer payroll console',
    text: 'Employers onboard an enterprise, manage employees, create payroll runs, generate commitments, build a Merkle batch, and issue verification links.',
    tag: 'Completed',
  },
  {
    icon: Users,
    title: 'Employee payslip verification',
    text: 'Every employee receives a unique private link to verify their own payment, commitment, Merkle proof, and transaction status.',
    tag: 'Completed',
  },
  {
    icon: FileSearch,
    title: 'Auditor reports',
    text: 'Auditors authenticate, enter an audit key, inspect payroll reports, view individual records, and generate audit logs.',
    tag: 'Completed',
  },
  {
    icon: Eye,
    title: 'Public proof page',
    text: 'Public verification exposes payroll totals, proof metadata, batch root, and payroll hash without leaking employee information.',
    tag: 'Completed',
  },
  {
    icon: LockKeyhole,
    title: 'Encrypted verification tokens',
    text: 'Verification tokens are protected with SHA256 token hashes and AES256 encrypted payloads instead of plaintext storage.',
    tag: 'Completed',
  },
  {
    icon: ReceiptText,
    title: 'Payroll history',
    text: 'Employers can review payroll runs, employee records, proof metadata, encrypted links, and audit key status.',
    tag: 'Completed',
  },
  {
    icon: Link2,
    title: 'Soroban contracts',
    text: 'Smart contracts for batch payroll, on chain verification, and Stellar payment execution are the next integration milestone.',
    tag: 'In progress',
  },
  {
    icon: ShieldCheck,
    title: 'Groth16 proofs',
    text: 'Proof generation currently uses placeholders. Real Groth16 proof generation and on chain verification are planned next.',
    tag: 'In progress',
  },
];

export function Features() {
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
    <section ref={sectionRef} className="relative overflow-hidden bg-white py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="max-w-3xl"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 800ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <p className="text-sm font-bold tracking-[0.26em] text-emerald-600 uppercase">
            Product surface
          </p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Payroll privacy from creation to verification.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            ZetaPay handles the full privacy flow: employer batch creation, employee payslip
            verification, auditor reporting, and public proof metadata.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isProgress = feature.tag === 'In progress';

            return (
              <div
                key={feature.title}
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 transition duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/70"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                  transition: `all 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 70}ms`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-white p-3 text-emerald-600 shadow-sm ring-1 ring-slate-200 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isProgress ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {feature.tag}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
