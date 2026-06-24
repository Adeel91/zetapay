'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Lock, Activity, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/80 py-24 lg:py-32"
    >
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] animate-pulse rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute -right-40 -bottom-40 h-[500px] w-[500px] animate-pulse rounded-full bg-teal-200/40 blur-3xl delay-1000" />
      <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-100/20 blur-3xl" />

      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:4rem_4rem] opacity-30"
        style={{
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(1.05) translateY(-10px)',
          transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-12">
          <div
            className="flex flex-col space-y-8 lg:col-span-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
              transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
            }}
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
                Live on Stellar Protocol 26 Testnet
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">
                Global Enterprise Payroll. <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Enforced Privacy.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Execute compliant, high‑throughput payroll pipelines with zero‑knowledge
                obfuscation. Zero exposure of corporate liquidity or employee data. Settlement in
                seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="group bg-slate-800 font-semibold text-white shadow-md transition-all hover:bg-slate-700"
                icon={
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                }
              >
                Launch Enterprise Console
              </Button>
              <Link
                href="/auditor"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3 font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Auditor Desk
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 border-t border-emerald-200/50 pt-8">
              {[
                { label: 'Network Fee', value: '< $0.001' },
                { label: 'Finality', value: '~2.5s' },
                { label: 'ZK Obfuscation', value: '100%' },
              ].map((metric, i) => (
                <div
                  key={i}
                  className="space-y-1"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${0.4 + i * 0.15}s`,
                  }}
                >
                  <p className="font-mono text-xl font-bold tracking-tight text-slate-800 lg:text-2xl">
                    {metric.value}
                  </p>
                  <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative lg:col-span-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
              transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
            }}
          >
            <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-white/20 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl transition-shadow duration-500 hover:shadow-emerald-500/20 lg:max-w-none">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-2 font-mono text-xs text-slate-400">zetapay‑core v2.6.0</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-300">
                  <Activity className="h-3 w-3 animate-pulse" />
                  Network Healthy
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-emerald-400/30 hover:bg-white/10">
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-300">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">Batch</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">Employees</p>
                  <p className="font-mono text-sm font-bold text-white">24</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-emerald-400/30 hover:bg-white/10">
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-300">
                      <Lock className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">ZK</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">Privacy Proof</p>
                  <p className="font-mono text-sm font-bold text-white">Generated</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:shadow-xl hover:shadow-emerald-900/20 sm:col-span-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-mono text-xs text-white">Stellar Settlement</span>
                    </div>
                    <span className="animate-pulse font-mono text-[11px] text-emerald-400">
                      TX# 48a2...f30e
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5 font-mono text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>• Total Amount</span>
                      <span className="text-white">$ 42,500.00 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Recipients</span>
                      <span className="text-white">24 employees</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Finality</span>
                      <span className="text-emerald-400">✔ 2.41s</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-center backdrop-blur-sm">
                <p className="text-xs font-medium text-slate-300">
                  Fully private payroll execution • Zero‑knowledge compliance ready
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
