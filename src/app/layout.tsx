import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'ZetaPay - Global Payroll with Zero-Knowledge Privacy',
  description:
    'Run global payroll on Stellar with zero-knowledge privacy. Instant settlement. Full compliance.',
  keywords: 'payroll, stellar, blockchain, zero-knowledge, privacy, enterprise',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
