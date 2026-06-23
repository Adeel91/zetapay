'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24">
      <div className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to transform your payroll?
        </h2>
        <p className="mt-3 text-lg text-slate-400">
          Join enterprises running payroll with privacy and speed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
            Start Free Trial
          </Button>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-8 py-4 font-semibold text-slate-300 transition-all hover:border-emerald-500 hover:text-white"
          >
            View Documentation
          </Link>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          No credit card required. Free for up to 10 employees.
        </p>
      </div>
    </section>
  );
}
