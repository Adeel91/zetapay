import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600">
                <span className="text-sm font-bold text-white">Z</span>
              </div>
              <span className="text-lg font-bold text-slate-900">ZetaPay</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Global payroll with zero-knowledge privacy. Built on Stellar.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Product</h4>
            <div className="mt-4 space-y-3">
              <Link
                href="/employer"
                className="block text-sm text-slate-600 transition-colors hover:text-emerald-600"
              >
                Employer
              </Link>
              <Link
                href="/auditor"
                className="block text-sm text-slate-600 transition-colors hover:text-emerald-600"
              >
                Auditor
              </Link>
              <Link
                href="/pricing"
                className="block text-sm text-slate-600 transition-colors hover:text-emerald-600"
              >
                Pricing
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Company</h4>
            <div className="mt-4 space-y-3">
              <Link
                href="/about"
                className="block text-sm text-slate-600 transition-colors hover:text-emerald-600"
              >
                About
              </Link>
              <Link
                href="/careers"
                className="block text-sm text-slate-600 transition-colors hover:text-emerald-600"
              >
                Careers
              </Link>
              <Link
                href="/blog"
                className="block text-sm text-slate-600 transition-colors hover:text-emerald-600"
              >
                Blog
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Legal</h4>
            <div className="mt-4 space-y-3">
              <Link
                href="/privacy"
                className="block text-sm text-slate-600 transition-colors hover:text-emerald-600"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="block text-sm text-slate-600 transition-colors hover:text-emerald-600"
              >
                Terms
              </Link>
              <Link
                href="/security"
                className="block text-sm text-slate-600 transition-colors hover:text-emerald-600"
              >
                Security
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          <p>© 2026 ZetaPay. All rights reserved. Built on Stellar.</p>
        </div>
      </div>
    </footer>
  );
}
