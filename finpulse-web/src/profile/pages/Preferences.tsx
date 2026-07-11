import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { usePreferences } from '../hooks/usePreferences';
import { useTheme } from '../../context/ThemeContext';
import { Settings, Bell, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Preferences() {
  const { data: profile } = useProfile();
  const { updatePreferences } = usePreferences();
  const { theme: currentTheme, setTheme } = useTheme();

  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'English',
    currency: 'INR (₹)',
    region: 'India',
    defaultDashboard: 'Portfolio'
  });

  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    earnings: true,
    news: true,
    portfolio: true,
    aiInsights: true,
    weeklySummary: true,
    monthlyReport: true,
    productUpdates: true
  });

  useEffect(() => {
    if (profile) {
      if (profile.preferences) {
        setPreferences(profile.preferences);
      }
      if (profile.notificationSettings) {
        setNotifications(profile.notificationSettings);
      }
    }
  }, [profile]);

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'theme') {
      const selected = value as 'light' | 'dark' | 'system';
      setTheme(selected);
    }
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    updatePreferences.mutate({
      preferences: preferences as any,
      notificationSettings: notifications
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link 
          to="/profile" 
          className="p-2 rounded-xl border border-slate-200/80 dark:border-white/5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">App Preferences & Layout</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Configure language, base currency, theme and alert notifications.</p>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-5">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-500" /> Regional & Layout Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Display Theme Mode</label>
            <select
              name="theme"
              value={preferences.theme}
              onChange={handlePreferenceChange}
              className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
              <option value="system">System Default</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Preferred Currency</label>
            <select
              name="currency"
              value={preferences.currency}
              onChange={handlePreferenceChange}
              className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
            >
              <option value="INR (₹)">INR (₹)</option>
              <option value="USD ($)">USD ($)</option>
              <option value="EUR (€)">EUR (€)</option>
              <option value="GBP (£)">GBP (£)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Primary Market Region</label>
            <select
              name="region"
              value={preferences.region}
              onChange={handlePreferenceChange}
              className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
            >
              <option value="India">India (NSE / BSE)</option>
              <option value="USA">United States (NYSE / NASDAQ)</option>
              <option value="Global">Global Portfolio Focus</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Default Landing View</label>
            <select
              name="defaultDashboard"
              value={preferences.defaultDashboard}
              onChange={handlePreferenceChange}
              className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
            >
              <option value="Portfolio">Portfolio Dashboard</option>
              <option value="Markets">Markets Overview</option>
              <option value="Watchlist">Watchlist Stream</option>
              <option value="Performance">CAGR / Performance Charts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-500" /> Notification Toggle settings
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Configure when and how we notify you of portfolio fluctuations.</p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Object.entries(notifications).map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
              <div key={key} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Receive pushes when active event updates fire.</p>
                </div>
                <button
                  onClick={() => handleNotificationToggle(key as any)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    value ? 'bg-blue-600 dark:bg-cyan-400' : 'bg-slate-200 dark:bg-white/10'
                  }`}
                >
                  <div className={`bg-white dark:bg-night-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    value ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={updatePreferences.isPending}
          className="flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-cyan-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-white dark:text-night-950 shadow-md hover:shadow-lg transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Save System Preferences
        </button>
      </div>
    </div>
  );
}
