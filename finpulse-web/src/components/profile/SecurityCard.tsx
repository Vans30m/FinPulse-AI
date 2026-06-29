import { Fingerprint, History, Laptop, LogOut, Trash2 } from "lucide-react";

interface SecurityCardProps {
  onChangePassword?: () => void;
  onToggle2FA?: () => void;
  onLogoutAllDevices?: () => void;
  onDeleteAccount?: () => void;
  twoFactorEnabled?: boolean;
}

export default function SecurityCard({
  onChangePassword,
  onToggle2FA,
  onLogoutAllDevices,
  onDeleteAccount,
  twoFactorEnabled = false
}: SecurityCardProps) {

  const activeSessions = [
    { device: "MacBook Pro (Chrome)", location: "Mumbai, India (Active Now)", isCurrent: true, icon: <Laptop className="h-4 w-4 text-emerald-500" /> },
    { device: "iPhone 15 Pro (Safari)", location: "Mumbai, India", isCurrent: false, icon: <Laptop className="h-4 w-4 text-slate-400" /> },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-6">
      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Security & Login Actions</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Manage passwords, authentication methods, and active browser sessions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Actions List */}
        <div className="space-y-3">
          <button
            onClick={onChangePassword}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] text-left text-xs font-black uppercase text-slate-700 dark:text-slate-350 transition-all"
          >
            <span>Change Account Password</span>
            <span className="text-[10px] lowercase text-slate-400">updated 3mo ago</span>
          </button>

          <button
            onClick={onToggle2FA}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] text-left text-xs font-black uppercase text-slate-700 dark:text-slate-350 transition-all"
          >
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4.5 w-4.5 text-blue-500" />
              <span>Two-Factor Authentication (2FA)</span>
            </div>
            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${
              twoFactorEnabled 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                : "bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200/50 dark:border-white/5"
            }`}>
              {twoFactorEnabled ? "Active" : "Disabled"}
            </span>
          </button>

          <button
            onClick={onLogoutAllDevices}
            className="w-full flex items-center gap-2 p-4 rounded-2xl border border-red-500/10 hover:bg-red-500/[0.02] text-left text-xs font-black uppercase text-red-500 transition-all"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Logout From All Devices</span>
          </button>

          <button
            onClick={onDeleteAccount}
            className="w-full flex items-center gap-2 p-4 rounded-2xl border border-rose-500/20 hover:bg-rose-500/[0.02] text-left text-xs font-black uppercase text-rose-500 transition-all"
          >
            <Trash2 className="h-4.5 w-4.5" />
            <span>Delete Account</span>
          </button>
        </div>

        {/* Sessions Activity */}
        <div className="p-5 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 dark:text-slate-500">
            <History className="h-4 w-4" />
            <span>Active Login Sessions</span>
          </div>

          <div className="space-y-3">
            {activeSessions.map((s, idx) => (
              <div key={idx} className="flex items-center gap-3 py-1">
                <div className="p-2 bg-white dark:bg-night-900 border border-slate-100 dark:border-white/5 rounded-xl shadow-sm">
                  {s.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.device}</p>
                    {s.isCurrent && (
                      <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-450 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">current</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-550 font-bold mt-0.5">{s.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
