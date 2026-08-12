import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ResetPassword({ onComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Password updated successfully!');
      setTimeout(() => {
        if (onComplete) onComplete(); // Switches back to the normal auth/login view
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-center mb-6 text-slate-600">
        Set New Password
      </h2>

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-[#2D5A27]/10 text-sm text-[#2D5A27] font-medium text-center border border-[#2D5A27]/20">
          {message}
        </div>
      )}

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
            New Password
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#2D5A27] hover:bg-[#23471e] text-white font-semibold text-sm rounded-xl transition disabled:opacity-50 mt-2 cursor-pointer shadow-sm"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={onComplete}
          className="text-sm text-[#2D5A27] hover:underline cursor-pointer font-medium"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}