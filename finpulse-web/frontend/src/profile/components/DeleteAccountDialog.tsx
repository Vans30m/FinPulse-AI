import { useState } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeleteAccountDialogProps {
  onConfirm: () => void;
}

export default function DeleteAccountDialog({ onConfirm }: DeleteAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your password to confirm deactivation');
      return;
    }
    if (!agree) {
      toast.error('You must confirm that you understand the deletion terms');
      return;
    }
    onConfirm();
  };

  return (
    <div className="rounded-3xl border border-red-200/60 dark:border-red-950/40 bg-white dark:bg-night-900 p-6 shadow-lg space-y-4">
      <div>
        <h3 className="text-base font-extrabold text-red-650 dark:text-red-400 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" /> Deactivate Account & Data
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Soft delete or disable your FinPulse dashboard. This action deletes all active device configurations.
        </p>
      </div>

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black transition-colors"
        >
          Begin Deactivation Process
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-200/20 text-xs text-red-600 dark:text-red-450 space-y-2">
            <p className="font-extrabold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Warning
            </p>
            <p>
              Your active watchlists, API integrations, portfolio trackers, and notification alerts will be deactivated. You can recover your profile credentials later by reaching support.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Confirm Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-900 dark:text-white transition-all"
              required
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="confirm-checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="confirm-checkbox" className="text-xs text-slate-650 dark:text-slate-400 select-none">
              I understand that this will invalidate all sessions and hide my profile statistics permanently.
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors"
            >
              Confirm Permanent Deactivation
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
