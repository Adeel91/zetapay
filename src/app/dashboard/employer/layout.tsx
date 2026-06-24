'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Key,
  Send,
} from 'lucide-react';
import { AUDITOR, EMPLOYER, ROUTES } from '@/config';

const employerNav = [
  { name: 'Dashboard', href: ROUTES.employer.root, icon: LayoutDashboard },
  { name: 'People', href: ROUTES.employer.employees, icon: Users },
  { name: 'Send Payment', href: ROUTES.employer.send, icon: Send },
  { name: 'History', href: ROUTES.employer.history, icon: History },
  { name: 'Settings', href: ROUTES.employer.settings, icon: Settings },
];

const auditorNav = [
  { name: 'Dashboard', href: ROUTES.auditor.root, icon: Key },
  { name: 'Verify', href: ROUTES.auditor.verify, icon: Shield },
  { name: 'Reports', href: ROUTES.auditor.reports, icon: FileText },
  { name: 'History', href: ROUTES.auditor.history, icon: History },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isEmployer = pathname?.startsWith(ROUTES.employer.root);
  const isAuditor = pathname?.startsWith(ROUTES.auditor.root);

  const navItems = isEmployer ? employerNav : isAuditor ? auditorNav : [];

  const role = isEmployer ? EMPLOYER : isAuditor ? AUDITOR : '';

  return (
    <div className="min-h-screen bg-slate-50">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-20 left-4 z-50 rounded-lg bg-white p-2 shadow-lg md:hidden"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed top-16 left-0 z-40 h-full w-64 border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-4 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase">{role}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-200 px-3 py-4">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
              <LogOut className="h-5 w-5 text-slate-400" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'ml-0 md:ml-64'
        }`}
      >
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
