'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, User, Wallet } from 'lucide-react';
import { DASHBOARD, AUTH, ROUTES, EMPLOYER } from '@/config';
import { useWallet } from '@/app/providers';

type UserInfo = {
  label: string;
  icon: 'Wallet' | 'User';
  type: string;
} | null;

interface NavbarProps {
  initialUserInfo: UserInfo;
}

export const refreshNavbarGlobal = () => {};

export function Navbar({ initialUserInfo }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { disconnect, isConnected } = useWallet();

  // Fall back to server-side info if client state is not yet logged out
  const userInfo = isConnected ? initialUserInfo : null;

  const isDashboard = pathname?.startsWith(DASHBOARD);
  const isAuthPage = pathname === AUTH || pathname?.startsWith(`${AUTH}/`);
  const isLanding = pathname === '/';

  const handleGetStarted = () => {
    window.location.href = AUTH;
  };

  const handleLogout = () => {
    disconnect();
    setIsOpen(false);
  };

  const getDashboardHref = () => {
    if (userInfo?.type === EMPLOYER) {
      return ROUTES.employer.root;
    }
    return ROUTES.auditor.root;
  };

  const renderNavLinks = () => {
    if (isAuthPage) return null;

    if (userInfo) {
      return (
        <Link
          href={getDashboardHref()}
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
            href={ROUTES.auth.auditorLogin}
            className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
          >
            Auditor
          </Link>
        )}
      </>
    );
  };

  const renderLaunchButton = () => {
    if (isAuthPage) return null;

    if (userInfo) {
      const Icon = userInfo.icon === 'Wallet' ? Wallet : User;
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
            <Icon className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-600">
              {userInfo.type}: {userInfo.label}
            </span>
          </div>
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
        onClick={handleGetStarted}
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700"
      >
        Get Started
      </button>
    );
  };

  const renderMobileNavLinks = () => {
    if (isAuthPage) return null;

    if (userInfo) {
      return (
        <>
          <Link
            href={getDashboardHref()}
            className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
            <span>
              {userInfo.type}: {userInfo.label}
            </span>
          </div>
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
            href={ROUTES.auth.auditorLogin}
            className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            onClick={() => setIsOpen(false)}
          >
            Auditor
          </Link>
        )}
        <button
          onClick={() => {
            handleGetStarted();
            setIsOpen(false);
          }}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
        >
          Get Started
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

          {!isAuthPage && (
            <button className="text-slate-900 md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
      </div>

      {isOpen && !isAuthPage && (
        <div className="border-b border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">{renderMobileNavLinks()}</div>
        </div>
      )}
    </nav>
  );
}
