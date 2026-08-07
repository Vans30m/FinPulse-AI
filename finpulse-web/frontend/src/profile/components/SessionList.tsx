import { Monitor, Smartphone, Globe, LogOut } from 'lucide-react';
import type { SessionData } from '../services/profileService';

interface SessionListProps {
  sessions: SessionData[];
  onRevoke: (id: string) => void;
  onRevokeAllOthers: () => void;
}

export default function SessionList({ sessions, onRevoke, onRevokeAllOthers }: SessionListProps) {
  const getDeviceIcon = (device: string) => {
    if (/mobile/i.test(device)) {
      return <Smartphone className="h-5 w-5 text-slate-500" />;
    }
    return <Monitor className="h-5 w-5 text-slate-500" />;
  };

  return (
    <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-500" /> Active Devices & Sessions
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Manage and audit your current active sessions.</p>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={onRevokeAllOthers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-500/20 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Revoke Other Devices
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {sessions.map((session, idx) => (
          <div key={session.id} className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
                {getDeviceIcon(session.device)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {session.device} - {session.browser}
                </p>
                <p className="text-xs text-slate-450 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Globe className="h-3 w-3" /> {session.ipAddress}
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  Logged in: {new Date(session.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {idx === 0 ? (
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-550/10">
                Current Device
              </span>
            ) : (
              <button
                onClick={() => onRevoke(session.id)}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
