import { useState } from 'react';
import { supabase } from '../supabaseClient';
import SavedConfirmation from './SavedConfirmation';
import useSavedConfirmation from './useSavedConfirmation';

export default function ResetPassword({ onComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { visible: savedVisible, trigger: triggerSaved, dismiss: dismissSaved } = useSavedConfirmation();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('Error: Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    triggerSaved();

    // The password is changed, but the browser still holds the temporary
    // recovery session from the email link. Sign out of it so the user
    // lands back on Sign In and has to log in with the new password,
    // instead of being carried straight into the dashboard on that
    // leftover session.
    await supabase.auth.signOut();

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 1800);

    setLoading(false);
  };

  // Cancelling never leaves a lingering recovery session behind either —
  // otherwise the app's auth listener would see a valid session and
  // route to the dashboard as if the user had actually signed in.
  const handleCancel = async () => {
    await supabase.auth.signOut();
    if (onComplete) onComplete();
  };

  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;
  const passwordsMatch = confirmPassword && newPassword === confirmPassword;

  return (
    <div className="space-y-4">
      {/* Visual Header */}
      <div className="text-center pt-2 pb-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2D5A27]/10 text-[#2D5A27] mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>
        </div>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-[#2D5A27] bg-[#2D5A27]/10 px-2.5 py-1 rounded-full w-max mx-auto mb-1.5">
          Security Update
        </span>
        <h2 className="text-xl font-bold text-slate-800">Set New Password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Please enter and confirm your new account password below.
        </p>
      </div>

      {/* Info Callout */}
      <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4 shrink-0 mt-0.5 text-amber-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <span>
          A strong password (8+ characters with mixed symbols) is recommended for extra security, but optional.
        </span>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`p-3 rounded-xl text-sm font-medium text-center border ${
            message.startsWith('Error')
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20'
          }`}
        >
          {message}
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleUpdatePassword} className="space-y-4 pt-1">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
            New Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
            placeholder="••••••••"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Re-enter New Password
            </label>
            {passwordsMatch && (
              <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                ✓ Matches
              </span>
            )}
          </div>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 shadow-sm ${
              passwordsMismatch
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : passwordsMatch
                ? 'border-emerald-500 focus:ring-emerald-500/20 focus:border-emerald-500'
                : 'border-slate-300 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]'
            }`}
            placeholder="••••••••"
          />
          {passwordsMismatch && (
            <p className="mt-1 text-xs text-red-500">
              Passwords do not match.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || passwordsMismatch}
          className="w-full py-2.5 px-4 bg-[#2D5A27] hover:bg-[#23471e] text-white font-semibold text-sm rounded-xl transition disabled:opacity-50 mt-2 cursor-pointer shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? 'Updating...' : 'Save New Password'}
        </button>
      </form>

      <div className="pt-2 text-center border-t border-slate-100">
        <button
          type="button"
          onClick={handleCancel}
          className="text-xs text-slate-500 hover:text-[#2D5A27] hover:underline cursor-pointer font-medium"
        >
          ← Cancel and return to Sign In
        </button>
      </div>

      <SavedConfirmation
        show={savedVisible}
        onDismiss={dismissSaved}
        message="Password updated. Please sign in again."
      />
    </div>
  );
}