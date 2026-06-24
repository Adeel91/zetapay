'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Building2, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import Cookies from 'js-cookie';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    companyEmail: '',
    defaultCurrency: 'USDC',
    taxRegion: 'US',
    payFrequency: 'monthly',
    autoProcess: false,
    requireApproval: true,
  });

  const fetchSettings = useCallback(async () => {
    const enterpriseId = Cookies.get('enterpriseId');
    if (!enterpriseId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/settings?enterpriseId=${enterpriseId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          companyName: data.companyName || '',
          companyEmail: data.companyEmail || '',
          defaultCurrency: data.defaultCurrency || 'USDC',
          taxRegion: data.taxRegion || 'US',
          payFrequency: data.payFrequency || 'monthly',
          autoProcess: data.autoProcess || false,
          requireApproval: data.requireApproval !== undefined ? data.requireApproval : true,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const enterpriseId = Cookies.get('enterpriseId');
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId: parseInt(enterpriseId!), ...settings }),
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const triggerFetch = async () => {
      await Promise.resolve();
      if (isMounted) {
        await fetchSettings();
      }
    };

    triggerFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchSettings]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your company preferences" />

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Building2 className="h-5 w-5" /> Company
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                placeholder="Your Company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Company Email</label>
              <input
                type="email"
                value={settings.companyEmail}
                onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                placeholder="hr@company.com"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Globe className="h-5 w-5" /> Payroll
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Default Currency</label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              >
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
                <option value="EURC">EURC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Tax Region</label>
              <select
                value={settings.taxRegion}
                onChange={(e) => setSettings({ ...settings, taxRegion: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              >
                <option value="US">United States</option>
                <option value="EU">Europe</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Pay Frequency</label>
              <select
                value={settings.payFrequency}
                onChange={(e) => setSettings({ ...settings, payFrequency: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Auto Process</label>
              <select
                value={settings.autoProcess ? 'true' : 'false'}
                onChange={(e) =>
                  setSettings({ ...settings, autoProcess: e.target.value === 'true' })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Shield className="h-5 w-5" /> Security
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Require Approval</p>
              <p className="text-sm text-slate-500">
                Require admin approval before payroll execution
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.requireApproval}
                onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} icon={<Save className="h-4 w-4" />}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
