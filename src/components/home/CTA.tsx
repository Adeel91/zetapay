'use client';

import Link from 'next/link';
import { ArrowRight, FileCheck2, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config';

export function CTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-slate-950 py-28 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.20),transparent_38%),linear-gradient(to_bottom,#0f172a,#020617)]" />
      <div className="animate-glow-pulse absolute top-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl sm:p-12 lg:p-16">
          <div className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
            <LockKeyhole className="h-4 w-4" />
            Privacy first payroll verification
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Start from the right dashboard.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Employers create payroll batches. Auditors verify approved reports. Employees access
            payslip verification through /verify/{'{token}'} links generated per payroll.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href={ROUTES.auth.root}>
              <Button
                size="lg"
                className="group rounded-2xl bg-emerald-400 px-8 py-4 font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-300"
                icon={
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                }
              >
                Open employer dashboard
              </Button>
            </Link>

            <Link
              href={ROUTES.auth.root}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white transition hover:border-white/20 hover:bg-white/10"
            >
              <FileCheck2 className="h-4 w-4 text-emerald-300" />
              Open auditor dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
