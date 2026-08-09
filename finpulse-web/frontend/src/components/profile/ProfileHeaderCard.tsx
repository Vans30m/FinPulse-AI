import { Camera, Mail, Calendar, CreditCard, Globe, Coins, Edit2 } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileHeaderCardProps {
  name: string;
  email: string;
  avatar?: string;
  memberSince?: string;
  plan?: string;
  country?: string;
  currency?: string;
  market?: string;
  onEditProfile?: () => void;
  onChangePassword?: () => void;
}

export default function ProfileHeaderCard({
  name,
  email,
  avatar,
  memberSince = "June 2024",
  plan = "Premium Plus",
  country = "India",
  currency = "INR (₹)",
  market = "NSE / BSE",
  onEditProfile,
  onChangePassword
}: ProfileHeaderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 shadow-xl overflow-hidden"
    >
      {/* Background Gradient Header banner */}
      <div className="h-32 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      </div>

      <div className="px-6 pb-6 relative z-10">
        {/* Avatar Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 mb-6 gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="relative">
              <div className="h-28 w-28 rounded-3xl bg-slate-100 dark:bg-night-855 p-1 border-4 border-white dark:border-night-900 shadow-xl overflow-hidden flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt={name} className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <div className="h-full w-full rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-black">
                    {(() => {
                      if (!name) return 'FP';
                      const parts = name.trim().split(/\s+/);
                      if (parts.length > 1) {
                        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                      }
                      return parts[0][0].toUpperCase();
                    })()}
                  </div>
                )}
              </div>
              <button 
                onClick={onEditProfile}
                className="absolute bottom-1 right-1 h-8 w-8 rounded-xl bg-white dark:bg-night-800 text-blue-600 dark:text-cyan-400 shadow-lg border border-slate-100 dark:border-white/5 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center justify-center sm:justify-start gap-2">
                <span>{name}</span>
                <button
                  onClick={onEditProfile}
                  className="text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 transition-colors p-1"
                  title="Edit Profile"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </h1>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
                <Mail className="h-3 w-3 shrink-0" /> {email}
              </p>
            </div>
          </div>
        </div>

        {/* User Info Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Member Since
            </span>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{memberSince}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Account tier
            </span>
            <p className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400">{plan}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Globe className="h-3 w-3" /> Location
            </span>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{country}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Coins className="h-3 w-3" /> Currency / Market
            </span>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{currency} / {market}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
