'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Code, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CTA() {
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
      className="relative overflow-hidden border-t border-white/5 bg-slate-950 py-28 text-white"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,#000_60%,transparent_100%)] bg-[size:3rem_3rem]" />
      <div className="absolute top-0 left-1/2 h-[350px] w-[600px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-b from-emerald-500/15 to-transparent blur-3xl" />
      <div className="absolute right-1/4 bottom-0 h-64 w-64 animate-pulse rounded-full bg-indigo-500/5 blur-2xl delay-1000" />

      <div
        className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.98)',
          transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
        }}
      >
        <div className="group relative space-y-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center shadow-2xl backdrop-blur-md sm:p-12 lg:p-16">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />

          <div className="mx-auto flex max-w-md items-center justify-center gap-6 border-b border-white/5 pb-6 font-mono text-[11px] tracking-widest text-slate-500 uppercase">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> SOC2 Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-emerald-400" /> API Native
            </span>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Upgrade Your Enterprise Liquidity Infrastructure <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                To Absolute Real-Time Speed.
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Transition away from slow global banking clearings. Run low-overhead, zero-knowledge
              compliance payroll tracks across the Stellar network today.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="group rounded-xl bg-emerald-500 px-8 py-4 font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-400"
              icon={
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              }
            >
              Deploy Custom Mainnet Build
            </Button>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white shadow-sm transition-all hover:border-white/20 hover:bg-white/10"
            >
              Developer Integration Docs
            </Link>
          </div>

          <div className="pt-4 text-xs font-medium text-slate-500">
            Sandbox Environment Active • Core platform remains free for up to 10 active contractor
            addresses.
          </div>
        </div>
      </div>
    </section>
  );
}
