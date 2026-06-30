import Link from 'next/link';
import { Code2, ShieldCheck, Sparkles } from 'lucide-react';
import { ROUTES } from '@/config';

const productLinks = [
  { label: 'Employer Dashboard', href: `${ROUTES.auth.root}` },
  { label: 'Auditor Dashboard', href: `${ROUTES.auth.root}` },
  { label: 'Employee Verify', href: '/verify/demo' },
];

const proofLinks = [
  { label: 'Private Payslips', href: '/#payroll-flow' },
  { label: 'Audit Keys', href: '/#security' },
  { label: 'Public Metadata', href: '/#verification' },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.16),transparent_32%),linear-gradient(to_bottom,#0f172a,#020617)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,#000_35%,transparent_75%)] bg-[size:3rem_3rem]" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">
                <span className="text-lg font-extrabold">Z</span>
              </div>
              <div>
                <span className="block text-xl font-extrabold tracking-tight">ZetaPay</span>
                <span className="text-xs font-bold tracking-[0.22em] text-emerald-300 uppercase">
                  Private payroll proofs
                </span>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Privacy preserving payroll verification powered by commitments, Merkle proofs,
              encrypted verification links, audit keys, Stellar, and Soroban.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Selective disclosure
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                Built for Stellar Hackathon
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-7">
            <FooterColumn title="Product" links={productLinks} />
            <FooterColumn title="Verification" links={proofLinks} />

            <div>
              <h4 className="text-sm font-extrabold tracking-[0.18em] text-white uppercase">
                Status
              </h4>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-bold text-white">Current milestone</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Private payroll verification is live. Groth16 and Soroban verification are in
                    progress.
                  </p>
                </div>

                <a
                  href="https://github.com/Adeel91/zetapay"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-emerald-300"
                >
                  <Code2 className="h-4 w-4" />
                  GitHub repository
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:mt-14 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 ZetaPay. Built for the Stellar Hackathon.</p>
          <p>
            Powered by Stellar, Soroban, Zero Knowledge Proofs, and privacy first payroll
            architecture.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-extrabold tracking-[0.18em] text-white uppercase">{title}</h4>

      <div className="mt-5 space-y-3">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="block text-sm font-semibold text-slate-400 transition hover:text-emerald-300"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
