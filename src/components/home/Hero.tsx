'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  EyeOff,
  FileCheck2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const proofRows = [
  ['batch_root', '0x8f41c91e93d0a7b4'],
  ['payroll_hash', '0x19b6e2ac74f55a90'],
  ['commitments', '24 generated'],
  ['verify_token', '/verify/{token}'],
];

export function Hero() {
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
      { threshold: 0.12 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-slate-950 py-24 text-white sm:py-28 lg:py-32"
    >
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_16%_18%,rgba(16,185,129,0.24),transparent_28%),radial-gradient(circle_at_80%_8%,rgba(45,212,191,0.18),transparent_26%),linear-gradient(to_bottom,#020617,#0f172a_45%,#020617)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,#000_38%,transparent_72%)] bg-[size:4rem_4rem]" />

      <div className="animate-glow-pulse absolute top-20 left-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full border border-emerald-300/10 bg-emerald-300/5 blur-sm" />
      <div className="absolute top-28 right-10 -z-10 hidden h-72 w-72 rounded-full bg-teal-300/20 blur-3xl lg:block" />
      <div className="absolute bottom-10 left-10 -z-10 hidden h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div
            className="lg:col-span-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 900ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-2xl shadow-emerald-950/20">
              <Sparkles className="h-4 w-4" />
              Privacy preserving payroll verification
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Payroll privacy with proof, not trust.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              ZetaPay lets employers generate private payroll batches, auditors verify approved
              reports, and employees open a token based verification page to view only their own
              payslip proof.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/dashboard/employer">
                <Button
                  size="lg"
                  className="group rounded-2xl bg-emerald-400 px-7 py-4 font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-300"
                  icon={
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  }
                >
                  Open employer view
                </Button>
              </Link>

              <Link
                href="/dashboard/auditor"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-white backdrop-blur transition hover:border-emerald-300/40 hover:bg-white/10"
              >
                <FileCheck2 className="h-4 w-4 text-emerald-300" />
                Open auditor view
              </Link>
            </div>
          </div>

          <div
            className="lg:col-span-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
              transition: 'all 1000ms cubic-bezier(0.22, 1, 0.36, 1) 180ms',
            }}
          >
            <div className="relative mx-auto max-w-xl">
              <div className="animate-glow-pulse absolute inset-0 rounded-[2.25rem] bg-emerald-400/20 blur-3xl" />
              <div className="absolute -inset-6 rounded-[2.75rem] border border-emerald-300/10" />

              <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl">
                <div className="absolute top-8 right-8 h-28 w-28 rounded-full bg-emerald-300/10 blur-2xl" />

                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-300" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-mono text-xs text-emerald-300">
                    payroll proof packet
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                        <Fingerprint className="h-5 w-5" />
                      </div>
                      <BadgeCheck className="h-5 w-5 text-emerald-300" />
                    </div>
                    <p className="mt-5 text-sm text-slate-400">Commitments</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-white">24</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <EyeOff className="h-5 w-5 text-emerald-300" />
                    </div>
                    <p className="mt-5 text-sm text-slate-400">Audit key</p>
                    <p className="mt-1 font-mono text-xl font-bold text-white">AUD 3A91</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:col-span-2">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                        <Network className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Verification output</p>
                        <p className="text-sm text-slate-400">
                          Employee payslip plus public metadata
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl bg-slate-950/70 p-4 font-mono text-xs">
                      {proofRows.map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">{key}</span>
                          <span className="text-emerald-200">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  <LockKeyhole className="h-4 w-4 text-emerald-300" />
                  /verify/{'{token}'} opens the employee payslip verification page.
                </div>

                <ShieldCheck className="pointer-events-none absolute right-9 bottom-9 h-8 w-8 text-emerald-300/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
