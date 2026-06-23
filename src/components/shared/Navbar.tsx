'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
              <span className="text-base font-bold text-white">Z</span>
            </div>
            <span className="text-xl font-bold text-slate-900">ZetaPay</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/employer"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
            >
              Employer
            </Link>
            <Link
              href="/auditor"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
            >
              Auditor
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
            >
              Pricing
            </Link>
            <Link
              href="/employer"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700"
            >
              Launch App
            </Link>
          </div>

          <button className="text-slate-900 md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/employer" className="text-sm font-medium hover:text-emerald-600">
              Employer
            </Link>
            <Link href="/auditor" className="text-sm font-medium hover:text-emerald-600">
              Auditor
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-emerald-600">
              Pricing
            </Link>
            <Link
              href="/employer"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              Launch App
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
