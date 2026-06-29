'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  FileKey2,
  Fingerprint,
  GitBranch,
  Hash,
  KeyRound,
  Link2,
  LockKeyhole,
  ReceiptText,
} from 'lucide-react';

const flow = [
  {
    icon: FileKey2,
    title: 'Payroll run',
    text: 'Employer creates a payroll run from employee records and payout values.',
  },
  {
    icon: Fingerprint,
    title: 'Commitments',
    text: 'Each employee payment becomes a private cryptographic commitment.',
  },
  {
    icon: GitBranch,
    title: 'Merkle batch',
    text: 'Commitments are inserted into a Merkle tree and produce a batch root.',
  },
  {
    icon: Hash,
    title: 'Proof metadata',
    text: 'ZetaPay stores payroll hash, proof metadata, and public verification data.',
  },
  {
    icon: Link2,
    title: 'Private links',
    text: 'Employees receive encrypted payslip verification links.',
  },
  {
    icon: KeyRound,
    title: 'Audit key',
    text: 'Auditors receive controlled access to the approved payroll report.',
  },
];

export function PayrollFlow() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % flow.length);
    }, 2800);

    return () => clearInterval(timer);
  }, []);

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

  const activeItem = flow[active];

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(20,184,166,0.10),transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="grid gap-12 lg:grid-cols-12 lg:items-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 800ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="lg:col-span-5">
            <p className="text-sm font-bold tracking-[0.26em] text-emerald-600 uppercase">
              Payroll flow
            </p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              A clean path from payroll data to private verification.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The flow is built around selective disclosure. Employers create the batch, employees
              verify their payslip, auditors unlock approved reports, and public viewers only see
              metadata.
            </p>

            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/50">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-300">Active step</p>
                  <h3 className="mt-1 text-2xl font-extrabold">{activeItem.title}</h3>
                </div>
                <div className="rounded-2xl bg-emerald-300 p-3 text-slate-950">
                  <activeItem.icon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm leading-7 text-slate-300">{activeItem.text}</p>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  key={active}
                  className="h-full rounded-full bg-emerald-300 transition-all duration-[2800ms]"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative mx-auto max-w-3xl">
              <div className="absolute top-1/2 left-1/2 hidden h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200 lg:block" />
              <div className="absolute top-1/2 left-1/2 hidden h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100 lg:block" />
              <div className="absolute top-1/2 left-1/2 hidden h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-100 blur-2xl lg:block" />

              <div className="relative grid gap-4 sm:grid-cols-2">
                {flow.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = active === index;

                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setActive(index)}
                      className={`group relative overflow-hidden rounded-[2rem] border p-6 text-left transition duration-500 ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 shadow-2xl shadow-emerald-100'
                          : 'border-slate-200 bg-white shadow-xl shadow-slate-100 hover:-translate-y-1'
                      }`}
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                        transition: `all 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 90}ms`,
                      }}
                    >
                      <div className="absolute top-0 right-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-emerald-200/40 blur-2xl" />

                      <div className="relative flex items-start gap-4">
                        <div
                          className={`rounded-2xl p-3 transition ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-mono text-xs font-bold text-slate-400">
                            {String(index + 1).padStart(2, '0')}
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-slate-950">{item.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-5 grid gap-4 md:grid-cols-3">
                {[
                  ['Employer', 'Controls payroll creation', BadgeCheck],
                  ['Employee', 'Views private payslip proof', ReceiptText],
                  ['Public', 'Sees metadata only', LockKeyhole],
                ].map(([title, text, Icon]) => (
                  <div
                    key={title as string}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-100"
                  >
                    <div className="mb-4 w-fit rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-950">{title as string}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
