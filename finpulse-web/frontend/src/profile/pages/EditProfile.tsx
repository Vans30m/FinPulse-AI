import React, { useState, useEffect } from 'react';
import { useProfile, useUpdateProfile, useAvatarUpload } from '../hooks/useProfile';
import AvatarUploader from '../components/AvatarUploader';
import { Layout, Save, ArrowLeft, Globe, Clock, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';

const COUNTRIES_MAPPING = [
  { name: 'India', flag: '🇮🇳', timezone: 'Asia/Kolkata', currency: 'INR (₹)' },
  { name: 'United States', flag: '🇺🇸', timezone: 'America/New_York', currency: 'USD ($)' },
  { name: 'United Kingdom', flag: '🇬🇧', timezone: 'Europe/London', currency: 'GBP (£)' },
  { name: 'Japan', flag: '🇯🇵', timezone: 'Asia/Tokyo', currency: 'JPY (¥)' },
  { name: 'Germany', flag: '🇩🇪', timezone: 'Europe/Berlin', currency: 'EUR (€)' },
  { name: 'France', flag: '🇫🇷', timezone: 'Europe/Paris', currency: 'EUR (€)' },
  { name: 'Canada', flag: '🇨🇦', timezone: 'America/Toronto', currency: 'CAD ($)' },
  { name: 'Australia', flag: '🇦🇺', timezone: 'Australia/Sydney', currency: 'AUD ($)' },
  { name: 'Singapore', flag: '🇸🇬', timezone: 'Asia/Singapore', currency: 'SGD ($)' },
  { name: 'Brazil', flag: '🇧🇷', timezone: 'America/Sao_Paulo', currency: 'BRL (R$)' },
  { name: 'South Africa', flag: '🇿🇦', timezone: 'Africa/Johannesburg', currency: 'ZAR (R)' },
  { name: 'United Arab Emirates', flag: '🇦🇪', timezone: 'Asia/Dubai', currency: 'AED (د.إ)' }
];

export default function EditProfile() {
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useAvatarUpload();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    country: '',
    timezone: '',
    currency: '',
    bio: '',
    occupation: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        phone: profile.phone || '',
        country: profile.country || 'India',
        timezone: profile.timezone || 'Asia/Kolkata',
        currency: profile.currency || 'INR (₹)',
        bio: profile.bio || '',
        occupation: profile.occupation || ''
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = e.target.value;
    const mapping = COUNTRIES_MAPPING.find(c => c.name === selectedCountry);
    if (mapping) {
      setFormData(prev => ({
        ...prev,
        country: selectedCountry,
        timezone: mapping.timezone,
        currency: mapping.currency
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        country: selectedCountry
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link 
          to="/profile" 
          className="p-2 rounded-xl border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Edit User Profile</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Update your public details and biography details.</p>
        </div>
      </div>

      <AvatarUploader 
        currentAvatar={profile?.avatar}
        onUpload={(base64) => uploadAvatarMutation.mutate(base64)}
        onRemove={() => uploadAvatarMutation.mutate('')}
      />

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-5">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Layout className="h-5 w-5 text-blue-500" /> Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-400 text-slate-900 dark:text-white transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-400 text-slate-900 dark:text-white transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-400 text-slate-900 dark:text-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Occupation</label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-400 text-slate-900 dark:text-white transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Country</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleCountryChange}
              className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-400 text-slate-900 dark:text-white transition-all cursor-pointer font-semibold"
            >
              {COUNTRIES_MAPPING.map(c => (
                <option key={c.name} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Currency (Auto-Mapped)</label>
            <input
              type="text"
              name="currency"
              value={formData.currency}
              readOnly
              className="w-full bg-slate-50 dark:bg-night-800/40 px-4 py-2.5 text-xs rounded-xl border border-transparent text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Short Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-400 text-slate-900 dark:text-white transition-all"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-cyan-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-white dark:text-night-950 shadow-md hover:shadow-lg transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Save Profile Details
          </button>
        </div>
      </form>
    </div>
  );
}
