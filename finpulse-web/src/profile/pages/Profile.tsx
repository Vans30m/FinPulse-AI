import { useProfile } from '../hooks/useProfile';
import ProfileHeader from '../components/ProfileHeader';
import { Layout, Settings, Mail, Clock, MapPin, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { data: profile, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <p className="text-sm font-bold text-slate-500">Loading user profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-bold">Failed to load profile. Please verify connection or sign in again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileHeader
        name={profile.name}
        email={profile.email}
        avatar={profile.avatar}
        memberSince={profile.createdAt}
        country={profile.country}
        currency={profile.currency}
        username={profile.username}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-4"
        >
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layout className="h-5 w-5 text-blue-500" /> Bio & Personal details
          </h3>

          <div className="space-y-3.5 pt-2">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Bio Description</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{profile.bio || 'No bio entered yet.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Occupation</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" /> {profile.occupation || 'N/A'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Phone Number</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> {profile.phone || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Timezone</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> {profile.timezone || 'UTC'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Country</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {profile.country || 'India'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Settings Preference Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-4"
        >
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-500" /> Dashboard Preferences
          </h3>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-650 dark:text-slate-450">Active Theme Color</span>
              <span className="text-xs font-black uppercase text-blue-650 dark:text-cyan-400">{profile.preferences?.theme || 'dark'}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-650 dark:text-slate-450">Base Currency</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{profile.preferences?.currency || 'INR (₹)'}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-650 dark:text-slate-450">Market Region</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{profile.preferences?.region || 'India'}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-xs font-bold text-slate-650 dark:text-slate-450">Default Landing View</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{profile.preferences?.defaultDashboard || 'Portfolio'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
