'use client';

import { CheckCircle2, CircleDot, Rocket } from 'lucide-react';

const phases = [
  {
    icon: CheckCircle2,
    label: 'Phase one',
    title: 'Private payroll verification',
    status: 'Live in app',
    text: 'The working product already covers employer payroll generation, Merkle batch creation, commitments, encrypted verification links, public metadata pages, employee payslip verification, auditor reports, audit keys, and audit history.',
    progress: '100%',
    items: ['Employer portal', 'Employee verify links', 'Auditor reports', 'Encrypted tokens'],
  },
  {
    icon: CircleDot,
    label: 'Phase two',
    title: 'Cryptographic proof upgrade',
    status: 'In progress',
    text: 'The placeholder proof layer is replaced with real Groth16 proof generation, stronger proof metadata, and cleaner proof verification boundaries.',
    progress: '45%',
    items: ['Groth16 generation', 'Proof storage', 'Proof validation', 'Verification metadata'],
  },
  {
    icon: Rocket,
    label: 'Phase three',
    title: 'Stellar and Soroban execution',
    status: 'Next milestone',
    text: 'Payroll batches move on chain through Soroban contracts, transaction hashes are recorded, and Stellar payment execution becomes part of the verification story.',
    progress: '20%',
    items: ['Soroban contracts', 'On chain verification', 'Stellar payments', 'Transaction hashes'],
  },
];

export function Roadmap() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-28 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.18),transparent_36%),linear-gradient(to_bottom,#0f172a,#020617)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,#000_42%,transparent_76%)] bg-[size:3.5rem_3.5rem]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold tracking-[0.26em] text-emerald-300 uppercase">Roadmap</p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            What is working now, what becomes real next.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            ZetaPay already has the privacy verification experience. The roadmap is focused on
            replacing placeholders with real proofs and moving verification plus settlement on
            chain.
          </p>
        </div>

        <div className="relative mt-16">
          <div className="absolute top-0 left-8 hidden h-full w-px bg-gradient-to-b from-emerald-300 via-emerald-300/30 to-transparent lg:block" />

          <div className="space-y-6">
            {phases.map((phase, index) => {
              const Icon = phase.icon;

              return (
                <div
                  key={phase.title}
                  className="relative grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-slate-950/30 backdrop-blur lg:grid-cols-12 lg:p-8"
                >
                  <div className="hidden lg:absolute lg:top-10 lg:left-8 lg:flex lg:h-12 lg:w-12 lg:-translate-x-1/2 lg:items-center lg:justify-center lg:rounded-full lg:bg-emerald-300 lg:text-slate-950">
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="lg:col-span-4 lg:pl-10">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950 lg:hidden">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-[0.22em] text-emerald-300 uppercase">
                          {phase.label}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-400">{phase.status}</p>
                      </div>
                    </div>

                    <h3 className="text-3xl font-extrabold">{phase.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{phase.text}</p>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {phase.items.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-bold text-slate-300"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-400">Progress</span>
                        <span className="font-mono text-lg font-extrabold text-emerald-300">
                          {phase.progress}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-300"
                          style={{ width: phase.progress }}
                        />
                      </div>
                      <p className="mt-4 text-xs leading-6 text-slate-500">
                        Phase {index + 1} of the product roadmap.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
