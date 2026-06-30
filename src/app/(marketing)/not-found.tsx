'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Home, ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-96 w-96 animate-pulse rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 animate-pulse rounded-full bg-emerald-500/5 blur-3xl delay-1000" />
      </div>

      <div
        className={`transform text-center transition-all duration-700 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <h1 className="text-[120px] leading-none font-black tracking-tighter text-slate-900 sm:text-[160px] md:text-[200px]">
          4
          <span className="relative inline-block">
            0
            <span className="absolute inset-0 animate-pulse text-emerald-600 mix-blend-screen">
              0
            </span>
          </span>
          4
        </h1>

        <div className="mt-6 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-600">
            <Zap className="h-4 w-4" />
            Page Not Found
          </div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Oops! You’ve wandered off course
          </h2>
          <p className="mx-auto max-w-md text-slate-500">
            The page you’re looking for doesn’t exist or has been moved. Let’s get you back on
            track.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/">
            <Button
              size="lg"
              icon={<Home className="h-4 w-4" />}
              className="bg-emerald-600 shadow-lg shadow-emerald-600/30 hover:bg-emerald-700"
            >
              Go Home
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>

        <div className="mt-16 flex items-center gap-2 text-xs text-slate-400">
          <span>ZetaPay • Privacy-first payroll</span>
        </div>
      </div>
    </div>
  );
}
