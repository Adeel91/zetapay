'use client';

import { useState, useEffect } from 'react';

const steps = [
  {
    step: '1',
    title: 'Upload Payroll',
    description: 'Upload your employee CSV or connect your HR system.',
  },
  {
    step: '2',
    title: 'Generate ZK Proof',
    description: 'Noir circuits generate zero-knowledge proofs. Salaries are masked forever.',
  },
  {
    step: '3',
    title: 'Execute Payment',
    description: 'Pay employees instantly with Stellar USDC. 2-second settlement.',
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold tracking-wider text-emerald-600 uppercase">
            How It Works
          </span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Simple. Private. Instant.</h2>
          <p className="mt-2 text-slate-500">Three steps to private, instant payroll</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((item, index) => (
            <div key={index} className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold transition-all duration-500 ${
                  index === activeStep
                    ? 'scale-110 bg-emerald-600 text-white shadow-xl shadow-emerald-600/30'
                    : 'bg-emerald-50 text-emerald-600'
                } `}
              >
                {item.step}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
