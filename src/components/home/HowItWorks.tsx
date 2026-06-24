'use client';

import { useState, useEffect, useRef } from 'react';
import { FileUp, Cpu, CreditCard, ChevronRight } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: FileUp,
    title: 'Ingest & Parse Payroll Ledger',
    description:
      'Upload your global workforce payout matrix via a standardized CSV template or pull directory configurations directly using our secure enterprise HR integrations.',
  },
  {
    step: '02',
    icon: Cpu,
    title: 'Generate Local Zero-Knowledge Proofs',
    description:
      'Noir cryptographic circuits compile data payloads in-browser. Immutable zero-knowledge proofs wrap payroll items, rendering ledger statements completely private.',
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Atomic Stellar Settlement',
    description:
      'The batch submits directly to our smart contracts, clearing payouts via Stellar USDC liquidity pools with deep settlement certainty in under three seconds.',
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(interval);
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

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-slate-900 py-24 text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/4 h-[450px] w-[450px] -translate-y-1/2 animate-pulse rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute right-1/3 bottom-1/4 h-64 w-64 animate-pulse rounded-full bg-blue-500/5 blur-[100px] delay-1000" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="max-w-2xl"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
          }}
        >
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
            Pipeline Workflow
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            From CSV ingestion to encrypted settlement in three phases
          </h2>
        </div>

        <div className="relative mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeStep;
            return (
              <div
                key={index}
                onClick={() => setActiveStep(index)}
                className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-8 transition-all duration-500 ${
                  isActive
                    ? 'scale-[1.02] border-emerald-500/80 bg-white/[0.06] shadow-2xl shadow-emerald-500/10'
                    : 'border-white/5 bg-transparent opacity-60 hover:border-white/10 hover:bg-white/5 hover:opacity-90'
                }`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + index * 0.15}s`,
                }}
              >
                {index < 2 && (
                  <ChevronRight className="absolute top-12 -right-7 hidden h-6 w-6 text-white/10 lg:block" />
                )}

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs font-bold tracking-widest ${
                        isActive ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      PHASE {item.step}
                    </span>
                    <div
                      className={`rounded-xl border p-2.5 transition-all duration-300 ${
                        isActive
                          ? 'border-emerald-400 bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20'
                          : 'border-white/5 bg-white/5 text-slate-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold tracking-tight text-white">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-400">{item.description}</p>
                  </div>
                </div>

                <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full bg-emerald-400 transition-all duration-[4500ms] ease-linear ${
                      isActive ? 'w-full' : 'w-0 duration-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
