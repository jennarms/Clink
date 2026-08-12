import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthForm() {
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 'identifier' holds either email or username during login
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, username: username || email.split('@')[0] }]);

          if (profileError) console.error('Profile creation error:', profileError.message);
        }

        setMessage('Account created successfully! You can now sign in.');
      } else {
        let loginEmail = identifier.trim();

        // If the user typed a username (no '@'), look up their email from the 'profiles' table
        if (!loginEmail.includes('@')) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', loginEmail)
            .single();

          if (profileError || !profile) {
            throw new Error('Username not found.');
          }

          // Fetch user details via admin/auth or perform direct lookup mapping
          // If RLS allows or via RPC/lookup table. Alternatively, store email in profiles table.
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', loginEmail)
            .single();

          if (userError || !userData?.email) {
            throw new Error('Could not resolve email for this username.');
          }

          loginEmail = userData.email;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

        if (error) throw error;
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-center mb-6 text-slate-600">
        {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
      </h2>

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-[#2D5A27]/10 text-sm text-[#2D5A27] font-medium text-center border border-[#2D5A27]/20">
          {message}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {authMode === 'signup' ? (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
                placeholder="yourname"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
                placeholder="you@example.com"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Email or Username
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
              placeholder="you@example.com or yourname"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#2D5A27] hover:bg-[#23471e] text-white font-semibold text-sm rounded-xl transition disabled:opacity-50 mt-2 cursor-pointer shadow-sm"
        >
          {loading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setAuthMode(authMode === 'login' ? 'signup' : 'login');
            setMessage('');
          }}
          className="text-sm text-[#2D5A27] hover:underline cursor-pointer font-medium"
        >
          {authMode === 'login'
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  );
}