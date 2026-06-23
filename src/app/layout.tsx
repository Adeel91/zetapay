import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { EMPLOYER, AUDITOR } from '@/config';

export const metadata: Metadata = {
  title: 'ZetaPay - Global Payroll with Zero-Knowledge Privacy',
  description:
    'Run global payroll on Stellar with zero-knowledge privacy. Instant settlement. Full compliance.',
  keywords: 'payroll, stellar, blockchain, zero-knowledge, privacy, enterprise',
};

type UserInfo = {
  label: string;
  icon: 'Wallet' | 'User';
  type: string;
} | null;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const role = cookieStore.get('zetaRole')?.value;
  const auditorSession = cookieStore.get('auditorSession')?.value;
  const wallet = cookieStore.get('zetaWallet')?.value;

  let userInfo: UserInfo = null;

  if (role === EMPLOYER && wallet) {
    userInfo = {
      label: `${wallet.slice(0, 8)} ... ${wallet.slice(-8)}`,
      icon: 'Wallet' as const,
      type: EMPLOYER,
    };
  } else if (role === AUDITOR && auditorSession) {
    try {
      const session = JSON.parse(decodeURIComponent(auditorSession));
      userInfo = {
        label: session.email || 'auditor@company.com',
        icon: 'User' as const,
        type: AUDITOR,
      };
    } catch {
      userInfo = {
        label: AUDITOR,
        icon: 'User' as const,
        type: AUDITOR,
      };
    }
  }

  return (
    <html lang="en">
      <body className="bg-slate-50" suppressHydrationWarning>
        <Providers>
          <Navbar initialUserInfo={userInfo} />
          <main className="pt-16">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
