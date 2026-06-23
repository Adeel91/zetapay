'use client';

import { Shield, Zap, Eye, Globe } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Zero-Knowledge Privacy',
    description: 'Salaries masked on-chain with Noir ZK circuits. Zero exposure, full compliance.',
  },
  {
    icon: Zap,
    title: 'Instant Settlement',
    description: '2-second finality on Stellar. No more waiting days for payroll to clear.',
  },
  {
    icon: Eye,
    title: 'Audit-Ready',
    description: 'Unique viewing keys for regulators. Full transparency when needed.',
  },
  {
    icon: Globe,
    title: 'Global Payments',
    description: 'Pay employees anywhere in the world using Stellar USDC.',
  },
];

export function Features() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold tracking-wider text-emerald-600 uppercase">
            Features
          </span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Why enterprises choose ZetaPay</h2>
          <p className="mt-2 text-slate-500">Everything you need for modern payroll</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white p-6 text-center transition-all hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <feature.icon className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
