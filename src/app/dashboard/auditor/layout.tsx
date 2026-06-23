'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, History, LogOut, Menu, X, Key } from 'lucide-react';
import { ROUTES } from '@/config';

const auditorNav = [
  { name: 'Dashboard', href: ROUTES.auditor.root, icon: LayoutDashboard },
  { name: 'Verify', href: ROUTES.auditor.verify, icon: Key },
  { name: 'Reports', href: ROUTES.auditor.reports, icon: FileText },
  { name: 'History', href: ROUTES.auditor.history, icon: History },
];

export default function AuditorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <p className="text-xs font-semibold text-slate-400 uppercase">Auditor</p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1">
              {auditorNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
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
