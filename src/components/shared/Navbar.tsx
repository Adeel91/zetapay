'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { DASHBOARD, ROLE, ROUTES } from '@/config';
import { useWallet } from '@/app/providers';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { connect, disconnect, isConnecting, isConnected, walletAddress } = useWallet();

  const isDashboard = pathname?.startsWith(DASHBOARD);
  const isRolePage = pathname === ROLE;
  const isLanding = pathname === '/';

  if (isRolePage) return null;

  const handleLaunch = async () => {
    if (isConnected) {
      const role = localStorage.getItem('zetaRole');
      if (role === 'employer') {
        window.location.href = ROUTES.employer.root;
      } else if (role === 'auditor') {
        window.location.href = ROUTES.auditor.root;
      } else {
        window.location.href = ROLE;
      }
    } else {
      await connect();
    }
  };

  const handleLogout = () => {
    disconnect();
    setIsOpen(false);
  };

  const renderNavLinks = () => {
    if (isConnected) {
      return (
        <Link
          href="/dashboard/employer"
          className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
        >
          Dashboard
        </Link>
      );
    }

    return (
      <>
        {!isLanding && (
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
          >
            Home
          </Link>
        )}
        {!isLanding && (
          <Link
            href="/auditor"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
          >
            Auditor
          </Link>
        )}
      </>
    );
  };

  const renderLaunchButton = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-500">
            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:border-red-500 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleLaunch}
        disabled={isConnecting}
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700 disabled:opacity-50"
      >
        {isConnecting ? 'Connecting...' : 'Launch App'}
      </button>
    );
  };

  const renderMobileNavLinks = () => {
    if (isConnected) {
      return (
        <>
          <Link
            href="/dashboard/employer"
            className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </>
      );
    }

    return (
      <>
        {!isLanding && (
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
        )}
        {!isLanding && (
          <Link
            href="/auditor"
            className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            onClick={() => setIsOpen(false)}
          >
            Auditor
          </Link>
        )}
        <button
          onClick={() => {
            handleLaunch();
            setIsOpen(false);
          }}
          disabled={isConnecting}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-center text-sm font-semibold text-white disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : 'Launch App'}
        </button>
      </>
    );
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isDashboard ? 'max-w-full' : 'max-w-6xl'}`}>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
              <span className="text-base font-bold text-white">Z</span>
            </div>
            <span className="text-xl font-bold text-slate-900">ZetaPay</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {renderNavLinks()}
            {renderLaunchButton()}
          </div>

          <button className="text-slate-900 md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">{renderMobileNavLinks()}</div>
        </div>
      )}
    </nav>
  );
}
