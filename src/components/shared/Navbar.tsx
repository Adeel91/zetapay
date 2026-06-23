'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, User, Wallet } from 'lucide-react';
import { DASHBOARD, AUTH, ROUTES, EMPLOYER, AUDITOR } from '@/config';
import { useWallet } from '@/app/providers';

type UserInfo = {
  label: string;
  icon: 'Wallet' | 'User';
  type: string;
} | null;

interface NavbarProps {
  initialUserInfo: UserInfo;
}

const getUserInfoFromCookies = (): UserInfo => {
  if (typeof window === 'undefined') return null;

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const role = getCookie('zetaRole');
  const auditorSession = getCookie('auditorSession');
  const wallet = getCookie('zetaWallet');

  if (role === EMPLOYER && wallet) {
    return {
      label: `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
      icon: 'Wallet',
      type: EMPLOYER,
    };
  }

  if (role === AUDITOR && auditorSession) {
    try {
      const session = JSON.parse(decodeURIComponent(auditorSession));
      return {
        label: session.email || 'auditor@company.com',
        icon: 'User',
        type: AUDITOR,
      };
    } catch {
      return {
        label: AUDITOR,
        icon: 'User',
        type: AUDITOR,
      };
    }
  }

  return null;
};

let refreshCallback: (() => void) | null = null;

export function Navbar({ initialUserInfo }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const cookies = getUserInfoFromCookies();
    return cookies || initialUserInfo;
  });
  const pathname = usePathname();
  const { disconnect } = useWallet();

  const isDashboard = pathname?.startsWith(DASHBOARD);
  const isAuthPage = pathname === AUTH || pathname?.startsWith(`${AUTH}/`);
  const isLanding = pathname === '/';

  useEffect(() => {
    refreshCallback = () => {
      const newUserInfo = getUserInfoFromCookies();
      setUserInfo(newUserInfo);
    };
    return () => {
      refreshCallback = null;
    };
  }, []);

  useEffect(() => {
    const handleCookieChange = () => {
      setUserInfo(getUserInfoFromCookies());
    };

    const interval = setInterval(handleCookieChange, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    window.location.href = AUTH;
  };

  const handleLogout = () => {
    disconnect();
    setIsOpen(false);
    setUserInfo(null);
  };

  const getDashboardHref = () => {
    if (userInfo?.type === EMPLOYER) {
      return ROUTES.employer.root;
    }
    return ROUTES.auditor.root;
  };

  const isConnected = !!userInfo;

  const renderNavLinks = () => {
    if (isAuthPage) return null;

    if (isConnected) {
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

    if (isConnected && userInfo) {
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

    if (isConnected && userInfo) {
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
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">{renderMobileNavLinks()}</div>
        </div>
      )}
    </nav>
  );
}

export const refreshNavbarGlobal = () => {
  if (refreshCallback) {
    refreshCallback();
  }
};
