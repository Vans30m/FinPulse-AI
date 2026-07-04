import { Camera, Mail, Calendar, CreditCard, Globe, Coins, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface ProfileHeaderProps {
  name: string;
  email: string;
  avatar?: string;
  memberSince?: string;
  country?: string;
  currency?: string;
  username?: string;
  onAvatarClick?: () => void;
}

export default function ProfileHeader({
  name,
  email,
  avatar,
  memberSince = "June 2024",
  country = "India",
  currency = "INR (₹)",
  username,
  onAvatarClick
}: ProfileHeaderProps) {
  const formattedDate = memberSince ? new Date(memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'June 2024';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 shadow-xl overflow-hidden mb-6"
    >
      <div className="h-32 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      </div>

      <div className="px-6 pb-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 mb-6 gap-4">
          <div className="flex items-end gap-4">
            <div className="relative group">
              <div className="h-28 w-28 rounded-3xl bg-slate-100 dark:bg-night-850 p-1 border-4 border-white dark:border-night-900 shadow-xl overflow-hidden flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt={name} className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <div className="h-full w-full rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-black">
                    {name ? name.slice(0, 2).toUpperCase() : "FP"}
                  </div>
                )}
              </div>
              <button 
                onClick={onAvatarClick}
                className="absolute bottom-1 right-1 h-8 w-8 rounded-xl bg-white dark:bg-night-800 text-blue-600 dark:text-cyan-400 shadow-lg border border-slate-100 dark:border-white/5 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {name || 'Vans'}
              </h1>
              {username && (
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  @{username}
                </p>
              )}
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" /> {email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/profile/edit"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Edit Profile
            </Link>
            <Link
              to="/profile/security"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Security
            </Link>
            <Link
              to="/profile/preferences"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Preferences
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Member Since
            </span>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{formattedDate}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Account status
            </span>
            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Shield className="h-3 w-3" /> Verified
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Globe className="h-3 w-3" /> Location
            </span>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{country || 'India'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Coins className="h-3 w-3" /> Currency
            </span>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{currency || 'INR (₹)'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
