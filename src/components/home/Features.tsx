'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, Zap, Eye, Globe, ArrowUpRight } from 'lucide-react';

export function Features() {
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

  const features = [
    {
      icon: Shield,
      title: 'Zero-Knowledge Cryptography',
      description:
        'Salaries are masked completely on-chain using advanced Noir ZK circuits. Corporate liquid resources, batch lists, and individual payloads remain invisible to competitors while validating balance checks.',
      badge: 'Circuits Compiled: Noir v0.32',
      highlight: 'Immutable Privacy',
      span: 'col-span-2',
    },
    {
      icon: Zap,
      title: '2-Second Settlement',
      description:
        'By anchoring transactions onto the Stellar network ledger, disbursements execute globally with absolute atomic finality in seconds.',
      badge: '2.0s',
      span: 'col-span-1',
    },
    {
      icon: Eye,
      title: 'Audit-Ready viewing keys',
      description:
        'Provide cryptographically secure viewing keys to regulatory auditors or accounting teams. Grant secure data visibility without leaking public credentials.',
      badge: 'Explore Compliance Framework',
      span: 'col-span-1',
    },
    {
      icon: Globe,
      title: 'Borderless USDC Rail Architecture',
      description:
        'Disburse payroll to employees, offshore development clusters, and freelancers using Stellar-native USD Coin. Avoid exorbitant wire handling premiums and complex banking settlement cycles.',
      badge: 'Americas • Europe / Africa • APAC Channels',
      span: 'col-span-2',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-slate-100 bg-white py-24"
    >
      <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-indigo-100/30 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-emerald-100/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-12 md:flex-row md:items-end"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
          }}
        >
          <div className="space-y-2">
            <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase">
              Capabilities
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Engineered for Enterprise Compliance
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-500 sm:text-base">
            ZetaPay merges private execution layers with public network finality to create a
            seamless settlement channel.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`group relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl ${feature.span === 'col-span-2' ? 'md:col-span-2' : ''} ${feature.span === 'col-span-1' ? '' : ''}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + index * 0.1}s`,
                }}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="space-y-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white text-emerald-600 shadow-sm transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                      <p className="max-w-xl text-sm leading-relaxed text-slate-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-slate-200/60 pt-4 font-mono text-xs text-slate-400">
                    <span>{feature.badge}</span>
                    {feature.highlight && (
                      <span className="font-semibold text-emerald-600">{feature.highlight}</span>
                    )}
                    {!feature.highlight && feature.span === 'col-span-1' && (
                      <span className="inline-flex items-center gap-1 text-slate-400 transition-colors group-hover:text-emerald-600">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
