import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ConfirmDialog from './ConfirmDialog';

const STEP_FORM = 'form';
const STEP_LINK_SENT = 'link_sent';

export default function DeleteAccount({ profile, onComplete }) {
  const [step, setStep] = useState(STEP_FORM);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(profile?.email || '');

  const canProceed = confirmText.trim().toUpperCase() === 'DELETE';

  // profile.email may not be populated (e.g. profiles row never synced with
  // auth.users.email), so fall back to the authenticated session's email.
  useEffect(() => {
    if (!email) {
      supabase.auth.getUser().then(({ data, error }) => {
        if (!error && data?.user?.email) {
          setEmail(data.user.email);
        }
      });
    }
  }, [email]);

  // Sends a confirmation link (not a code) to the account's registered email.
  // Clicking it lands the user on /confirm-delete-account, which finishes
  // the deletion.
  const handleSendLink = async () => {
    setShowConfirmDialog(false);

    if (!email) {
      setMessage(
        'Error: No email found on this account, so we can\u2019t send a confirmation link. Please contact support to delete your account.'
      );
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/confirm-delete-account`,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    setStep(STEP_LINK_SENT);
    setLoading(false);
  };

  const handleResend = () => {
    setMessage('');
    handleSendLink();
  };

  // ---------- Step 2: link sent, waiting for the user to click it ----------
  if (step === STEP_LINK_SENT) {
    return (
      <div className="space-y-4">
        <div className="text-center pt-2 pb-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Check Your Email</h2>
          <p className="text-xs text-slate-500 mt-1">
            We sent a confirmation link to <span className="font-semibold">{email}</span>
          </p>
        </div>

        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300">
          Click the link in that email to permanently delete your account. The link expires shortly and can only be used once.
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-sm text-center border ${
              message.startsWith('Error')
                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:border-red-900/50'
                : 'bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20'
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-slate-500 hover:text-[#2D5A27] hover:underline cursor-pointer font-medium disabled:opacity-50"
          >
            Resend email
          </button>
          <button
            type="button"
            onClick={() => {
              setStep(STEP_FORM);
              setMessage('');
            }}
            className="text-slate-500 hover:text-[#2D5A27] hover:underline cursor-pointer font-medium"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ---------- Step 1: type DELETE, request link ----------
  return (
    <div className="space-y-4">
      <div className="text-center pt-2 pb-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Delete Account</h2>
        <p className="text-xs text-slate-500 mt-1">This action is permanent and cannot be undone.</p>
      </div>

      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 space-y-1.5">
        <p className="font-semibold">Deleting your account will:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Remove your profile and public page permanently</li>
          <li>Delete all your saved links</li>
          <li>Sign you out immediately, everywhere</li>
        </ul>
      </div>

      {message && (
        <div className="p-3 rounded-xl text-sm text-center border bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:border-red-900/50">
          {message}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300">
          Type DELETE to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 rounded-xl text-[#1A1A1A] dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-sm"
          placeholder="DELETE"
        />
      </div>

      <button
        type="button"
        disabled={!canProceed || loading}
        onClick={() => setShowConfirmDialog(true)}
        className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition disabled:opacity-40 cursor-pointer shadow-sm"
      >
        {loading ? 'Sending link...' : 'Continue'}
      </button>

      <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-700">
        <button
          type="button"
          onClick={onComplete}
          className="text-xs text-slate-500 hover:text-[#2D5A27] hover:underline cursor-pointer font-medium"
        >
          ← Cancel and go back
        </button>
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        title="Delete your account?"
        message={`We'll send a confirmation link to ${email}. You'll need to click it to finish deleting your account.`}
        confirmLabel="Send link"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={handleSendLink}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}