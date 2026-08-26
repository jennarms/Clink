import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ChangeEmail({ profile, onComplete, onRefreshSession }) {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setSent(false);
    } else {
      setMessage(
        `We sent a confirmation link to ${newEmail}. Your email won't update here until you click it.`
      );
      setSent(true);
    }
    setLoading(false);
  };

  const handleBack = () => {
    // In case they confirmed the change in another tab and came back,
    // pull the latest session so Account Settings shows the new email.
    onRefreshSession?.();
    onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="text-center pt-2 pb-1">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Change Email</h2>
        <p className="text-xs text-slate-500 mt-1">Current email: {profile?.email}</p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-sm text-center border ${
            message.startsWith('Error')
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20'
          }`}
        >
          {message}
        </div>
      )}

      {!sent && (
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300">
              New Email
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-[#1A1A1A] dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
              placeholder="new@email.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#2D5A27] hover:bg-[#23471e] text-white font-semibold text-sm rounded-xl transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? 'Sending...' : 'Update Email'}
          </button>
        </form>
      )}

      <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-700">
        <button
          type="button"
          onClick={handleBack}
          className="text-xs text-slate-500 hover:text-[#2D5A27] hover:underline cursor-pointer font-medium"
        >
          ← Back to Account Settings
        </button>
      </div>
    </div>
  );
}