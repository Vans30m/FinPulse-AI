import { Fingerprint, History, Laptop, LogOut, Trash2, Smartphone, Monitor, Mail, ChevronRight } from "lucide-react";

export interface SessionData {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
}

interface SecurityCardProps {
  onChangePassword?: () => void;
  onToggle2FA?: () => void;
  onDeleteAccount?: () => void;
  onRevokeSession?: (id: string) => void;
  twoFactorEnabled?: boolean;
  sessions?: SessionData[];
  currentSessionId?: string;
  onLogout?: () => void;
}

export default function SecurityCard({
  onChangePassword,
  onToggle2FA,
  onDeleteAccount,
  onRevokeSession,
  twoFactorEnabled = false,
  sessions = [],
  currentSessionId = "",
  onLogout
}: SecurityCardProps) {

  const getSessionIcon = (device: string) => {
    const devLower = device.toLowerCase();
    if (devLower.includes("mobile") || devLower.includes("phone") || devLower.includes("android") || devLower.includes("ios") || devLower.includes("iphone")) {
      return <Smartphone className="h-4 w-4 text-blue-500 dark:text-cyan-400" />;
    }
    return <Monitor className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />;
  };

  return (
    <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-xl space-y-6">
      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-indigo-500" /> Security & Login Actions
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Manage passwords, authentication methods, and active browser sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions List */}
        <div className="space-y-4">
          <button
            onClick={onChangePassword}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 hover:border-indigo-500/50 dark:hover:border-cyan-400/50 bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.03] text-left transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">Change Password</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mediumNormal truncate">Update your account login credentials</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-cyan-450 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 hover:border-amber-500/50 dark:hover:border-amber-400/50 bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.03] text-left transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <LogOut className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">Account Logout</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mediumNormal truncate">End current active session safely</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-amber-550 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
          </button>

          <button
            onClick={onDeleteAccount}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-rose-500/10 dark:border-rose-500/20 hover:border-rose-500/50 dark:hover:border-rose-455/50 bg-rose-500/[0.02] dark:bg-rose-500/[0.01] hover:bg-rose-500/5 dark:hover:bg-rose-500/10 text-left transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-650 dark:text-rose-400 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">Delete Account</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mediumNormal truncate">Permanently delete profile & portfolio data</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
          </button>
        </div>

        {/* Sessions Activity */}
        <div className="p-5 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 dark:text-slate-500">
              <History className="h-4 w-4 text-indigo-500" />
              <span>Active Sessions</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
              {sessions.length || 1} Device{sessions.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-450 dark:text-slate-500 font-bold text-center py-4">No active sessions found.</p>
            ) : (
              sessions.map((s, idx) => {
                const isCurrent = s.id === currentSessionId || idx === 0; // fallback to first session if id not matched
                return (
                  <div key={s.id || idx} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white dark:bg-night-900 border border-slate-150 dark:border-white/5 rounded-xl shadow-sm">
                        {getSessionIcon(s.device)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.device} ({s.browser})</p>
                          {isCurrent && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          IP: {s.ipAddress ? `${s.ipAddress.split('.').slice(0,2).join('.')}.*.*` : 'Unknown'} • Active: {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Current</span>
                    ) : onRevokeSession ? (
                      <button 
                        onClick={() => onRevokeSession(s.id)}
                        className="text-[9px] font-black text-rose-500 hover:text-white bg-transparent hover:bg-rose-500 px-3 py-1 rounded-lg border border-rose-500/30 hover:border-rose-500 uppercase transition-all duration-300"
                      >
                        Revoke
                      </button>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
