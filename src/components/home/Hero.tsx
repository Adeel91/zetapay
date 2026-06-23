'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <Sparkles className="mr-1 inline h-4 w-4" />
              Now on Stellar Testnet
            </span>
            <h1 className="mt-6 text-4xl font-bold text-slate-900 sm:text-5xl lg:text-6xl">
              Pay employees globally <span className="text-emerald-600">with privacy</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Enterprise payroll with zero-knowledge privacy on Stellar. Instant settlement. Full
              compliance. Pennies per transaction.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                Get Started
              </Button>
              <Link
                href="/auditor"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-8 py-3.5 font-semibold text-slate-700 transition-all hover:border-emerald-600 hover:text-emerald-600"
              >
                Auditor Portal
              </Link>
            </div>
            <div className="mt-10 flex gap-8 border-t border-slate-200 pt-8">
              <div>
                <p className="text-2xl font-bold text-slate-900">$0.001</p>
                <p className="text-sm text-slate-500">Avg fee</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">2s</p>
                <p className="text-sm text-slate-500">Settlement</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">100%</p>
                <p className="text-sm text-slate-500">ZK privacy</p>
              </div>
            </div>
          </div>

          <div className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-8 shadow-xl delay-200">
            <div className="border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-50 p-2">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Audit-ready by design</p>
                  <p className="text-sm text-slate-500">Viewing keys for compliance</p>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">$0.001</p>
                <p className="text-xs text-slate-500">Avg fee</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">2s</p>
                <p className="text-xs text-slate-500">Settlement</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">100%</p>
                <p className="text-xs text-slate-500">ZK privacy</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">∞</p>
                <p className="text-xs text-slate-500">Global reach</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-emerald-50 p-3 text-center">
              <p className="text-sm text-emerald-700">✦ Powered by Stellar Protocol 26 + Noir ZK</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
