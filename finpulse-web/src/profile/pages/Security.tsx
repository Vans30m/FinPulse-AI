import React, { useState } from 'react';
import { useChangePassword, useSessions, useRevokeSession, useRevokeAllOtherSessions, useDeleteAccount } from '../hooks/useProfile';
import PasswordStrength from '../components/PasswordStrength';
import SessionList from '../components/SessionList';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import { Shield, Eye, EyeOff, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Security() {
  const changePasswordMutation = useChangePassword();
  const { data: sessions = [], isLoading: isLoadingSessions } = useSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllOthersMutation = useRevokeAllOtherSessions();
  const deleteAccountMutation = useDeleteAccount();

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Password Policy
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    if (newPassword.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      toast.error('Password does not meet validation requirements');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    }, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };

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
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Security Settings</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Update security parameters, credentials, and devices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Change Password Form */}
        <form onSubmit={handlePasswordSubmit} className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-5">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" /> Change Password
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-night-800/80 px-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPassword ? 'Hide Passwords' : 'Show Passwords'}
              </button>
            </div>

            {newPassword && <PasswordStrength value={newPassword} />}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-cyan-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-white dark:text-night-950 shadow-md hover:shadow-lg transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Update Password
            </button>
          </div>
        </form>

        {/* Sessions list */}
        {!isLoadingSessions && (
          <SessionList
            sessions={sessions}
            onRevoke={(id) => revokeSessionMutation.mutate(id)}
            onRevokeAllOthers={() => revokeAllOthersMutation.mutate()}
          />
        )}

        {/* Delete Account area */}
        <DeleteAccountDialog
          onConfirm={() => deleteAccountMutation.mutate()}
        />
      </div>
    </div>
  );
}
