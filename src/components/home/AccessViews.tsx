'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';

type View = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  text: string;
  href?: string;
  action?: string;
  items: string[];
};

const views: View[] = [
  {
    icon: Building2,
    eyebrow: 'Employer view',
    title: 'Build the payroll batch',
    text: 'Create payroll runs, generate commitments, build Merkle roots, produce audit keys, and issue encrypted verification links.',
    href: '/dashboard/employer',
    action: 'Open employer dashboard',
    items: ['Employees', 'Payroll runs', 'Commitments', 'Merkle root'],
  },
  {
    icon: FileCheck2,
    eyebrow: 'Auditor view',
    title: 'Unlock approved reports',
    text: 'Auditors use a scoped audit key to review payroll reports, inspect approved records, and generate audit logs.',
    href: '/dashboard/auditor',
    action: 'Open auditor dashboard',
    items: ['Audit key', 'Payroll report', 'Record viewer', 'Audit log'],
  },
  {
    icon: ReceiptText,
    eyebrow: 'Employee verification',
    title: 'Verify one payslip only',
    text: 'Employees receive /verify/{token}. The page reveals only their own payslip proof, commitment, Merkle path, and transaction status.',
    items: ['Payslip proof', 'Commitment', 'Merkle path', 'Status'],
  },
];

export function AccessViews() {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_86%_68%,rgba(20,184,166,0.14),transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,#000_42%,transparent_78%)] bg-[size:3.5rem_3.5rem]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-sm font-bold tracking-[0.28em] text-emerald-300 uppercase">
              Three views
            </p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              One payroll batch. Three controlled windows.
            </h2>
          </div>

          <p className="text-base leading-8 text-slate-300 sm:text-lg lg:col-span-5">
            Employer controls, auditor visibility, and employee verification are separated so
            payroll data never becomes public by default.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            {views.map((view) => {
              const Icon = view.icon;

              return (
                <div
                  key={view.title}
                  className="group rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 transition duration-300 hover:border-emerald-300/40 hover:bg-white/[0.075]"
                >
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300 ring-1 ring-emerald-300/20 transition group-hover:bg-emerald-300 group-hover:text-slate-950">
                      <Icon className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-xs font-bold tracking-[0.2em] text-emerald-300 uppercase">
                        {view.eyebrow}
                      </p>
                      <h3 className="mt-2 text-xl font-extrabold">{view.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-400">{view.text}</p>

                      {view.href ? (
                        <Link
                          href={view.href}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-300 transition hover:text-emerald-200"
                        >
                          {view.action}
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </Link>
                      ) : (
                        <p className="mt-4 text-sm font-bold text-slate-300">
                          Access is generated after payroll processing.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-slate-950/30 sm:p-7">
              <div className="absolute top-0 right-0 h-80 w-80 translate-x-16 -translate-y-16 rounded-full bg-emerald-300/10 blur-3xl" />

              <div className="relative rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-5 sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold tracking-[0.24em] text-emerald-300 uppercase">
                      Visibility map
                    </p>
                    <h3 className="mt-3 text-3xl font-extrabold">
                      Same proof layer. Different access.
                    </h3>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-200">
                    <ShieldCheck className="h-4 w-4" />
                    Selective disclosure
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {views.map((view) => (
                    <div
                      key={view.eyebrow}
                      className="rounded-3xl border border-white/10 bg-white/[0.045] p-4"
                    >
                      <p className="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                        {view.eyebrow}
                      </p>

                      <div className="mt-4 space-y-2">
                        {view.items.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 rounded-2xl bg-white/[0.05] px-3 py-2 text-sm font-semibold text-slate-300"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-5">
                    <LockKeyhole className="h-6 w-6 text-emerald-300" />
                    <p className="mt-4 text-lg font-extrabold">Private by default</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Payroll details are exposed only through scoped access.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                    <KeyRound className="h-6 w-6 text-emerald-300" />
                    <p className="mt-4 text-lg font-extrabold">Audit keyed</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Audit reports are unlocked with payroll specific keys.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                    <ReceiptText className="h-6 w-6 text-emerald-300" />
                    <p className="mt-4 text-lg font-extrabold">Token verified</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Employees verify only their own payslip through /verify/{'{token}'}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
