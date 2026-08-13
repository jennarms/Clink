import { useState } from 'react';
import { supabase } from '../supabaseClient';

// A handful of generic categories, not real brand logos — just enough
// to sketch "here's what a Linkie page looks like" at a glance.
const PREVIEW_LINKS = [
  { emoji: '🎵', label: 'Music' },
  { emoji: '📸', label: 'Photos' },
  { emoji: '▶️', label: 'Videos' },
  { emoji: '🛍️', label: 'Shop' },
  { emoji: '🌐', label: 'Portfolio' },
];

export default function AuthForm() {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Non-blocking password strength check
  const getPasswordStrength = (pass) => {
    if (!pass) return null;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (pass.length < 6 || score <= 1) {
      return {
        label: 'Weak',
        color: 'text-amber-600',
        bgColor: 'bg-amber-500',
        width: 'w-1/3',
        hint: 'Weak password. Simple passwords are still allowed.',
      };
    }
    if (score <= 3) {
      return {
        label: 'Medium',
        color: 'text-blue-600',
        bgColor: 'bg-blue-500',
        width: 'w-2/3',
        hint: 'Good password!',
      };
    }
    return {
      label: 'Strong',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500',
      width: 'w-full',
      hint: 'Great! Strong password.',
    };
  };

  const strength = getPasswordStrength(password);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim() || email.trim().split('@')[0],
          display_name: displayName,
        },
      },
    });

    if (authError) throw authError;

    setMessage('Account created successfully!');
  };

  const handleLogin = async () => {
    let loginEmail = identifier.trim();

    if (!loginEmail.includes('@')) {
      // Username login: resolve to an email via a SECURITY DEFINER
      // RPC function instead of querying `profiles` directly. The
      // `profiles.email` column is not directly selectable by clients
      // (see linkie_auth_fix.sql), so this is the only path that can
      // return it, and it only ever returns the email string — nothing
      // else about the row.
      const { data: resolvedEmail, error: lookupError } = await supabase.rpc(
        'get_email_for_username',
        { p_username: loginEmail }
      );

      if (lookupError || !resolvedEmail) {
        throw new Error('Username not found or invalid.');
      }
      loginEmail = resolvedEmail;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) throw error;
  };

  const handleForgotPassword = async () => {
    const resetEmail = email.trim() || identifier.trim();

    if (!resetEmail || !resetEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    setMessage('Password reset link sent! Please check your email inbox.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (authMode === 'signup') {
        await handleSignUp();
      } else if (authMode === 'login') {
        await handleLogin();
      } else if (authMode === 'forgot') {
        await handleForgotPassword();
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ---------- shared pieces ----------

  const headerText =
    authMode === 'login'
      ? 'Login to your account'
      : authMode === 'signup'
      ? 'Create an Account'
      : 'Reset Your Password';

  const MessageBanner = message ? (
    <div className="mb-4 p-3 rounded-xl bg-[#2D5A27]/10 text-sm text-[#2D5A27] font-medium text-center border border-[#2D5A27]/20">
      {message}
    </div>
  ) : null;

  const ToggleNav = (
    <div className="mt-4 text-center">
      {authMode === 'forgot' ? (
        <button
          onClick={() => {
            setAuthMode('login');
            setMessage('');
          }}
          className="text-sm text-[#2D5A27] hover:underline cursor-pointer font-medium"
        >
          Back to Sign In
        </button>
      ) : (
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
      )}
    </div>
  );

  const SubmitButton = (
    <button
      type="submit"
      disabled={loading || (authMode === 'signup' && confirmPassword && password !== confirmPassword)}
      className="w-full py-2.5 px-4 bg-[#2D5A27] hover:bg-[#23471e] text-white font-semibold text-sm rounded-xl transition disabled:opacity-50 mt-2 cursor-pointer shadow-sm"
    >
      {loading
        ? 'Processing...'
        : authMode === 'login'
        ? 'Sign In'
        : authMode === 'signup'
        ? 'Sign Up'
        : 'Send Reset Link'}
    </button>
  );

  // ---------- mode-specific fields ----------

  const SignupFields = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
            placeholder="Jane"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
            placeholder="Doe"
          />
        </div>
      </div>

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

        {strength && (
          <div className="mt-2 text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Password strength:</span>
              <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 ${strength.bgColor} ${strength.width}`} />
            </div>
            <p className="text-slate-500 text-[11px] leading-tight">{strength.hint}</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
          Confirm Password
        </label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 shadow-sm ${
            confirmPassword && password !== confirmPassword
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              : 'border-slate-300 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]'
          }`}
          placeholder="••••••••"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
        )}
      </div>
    </>
  );

  const LoginFields = (
    <>
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

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Password
          </label>
          <button
            type="button"
            onClick={() => {
              setEmail(identifier.includes('@') ? identifier : '');
              setAuthMode('forgot');
              setMessage('');
            }}
            className="text-xs text-[#2D5A27] hover:underline font-medium cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[#1A1A1A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
          placeholder="••••••••"
        />
      </div>
    </>
  );

  const ForgotFields = (
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
      <p className="mt-1 text-xs text-slate-500">
        Enter the email address associated with your account to receive a reset link.
      </p>
    </div>
  );

  // ---------- LOGIN: split-screen layout ----------
  if (authMode === 'login') {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-white">
        {/* Left: about panel */}
        <div className="lg:w-[45%] bg-[#EAF3E5] px-8 py-14 sm:px-14 lg:py-0 flex items-center relative overflow-hidden">
          <div className="max-w-md mx-auto lg:mx-0">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#2D5A27]/70 mb-4">
              linkie.com/yourname
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] leading-tight mb-4">
              Every place people can find you.
              <br />
              One link.
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
              Add your music, your shop, your latest video — whatever you
              want someone to see first. Linkie keeps it all on one page,
              yours to arrange.
            </p>

            {/* Signature element: a mini preview of a Linkie page */}
            <div className="bg-white rounded-2xl shadow-md border border-[#2D5A27]/10 p-4 max-w-xs -rotate-1">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-7 h-7 rounded-full bg-[#2D5A27]/15" />
                <div className="h-2 w-20 rounded-full bg-[#2D5A27]/15" />
              </div>
              <div className="space-y-2">
                {PREVIEW_LINKS.map((link, i) => (
                  <div
                    key={link.label}
                    className={`flex items-center gap-3 bg-[#EAF3E5] rounded-xl px-3 py-2.5 transition-transform hover:-translate-y-0.5 ${
                      i % 2 === 0 ? 'rotate-0' : 'rotate-[0.5deg]'
                    }`}
                  >
                    <span className="text-base leading-none">{link.emoji}</span>
                    <span className="text-xs font-medium text-[#1A1A1A]">
                      {link.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: sign-in form */}
        <div className="flex-1 flex items-center justify-center px-6 py-14 sm:px-10">
          <div className="w-full max-w-sm">
            <h2 className="text-lg font-semibold text-center mb-6 text-slate-600">
              {headerText}
            </h2>

            {MessageBanner}

            <form onSubmit={handleSubmit} className="space-y-4">
              {LoginFields}
              {SubmitButton}
            </form>

            {ToggleNav}
          </div>
        </div>
      </div>
    );
  }

  // ---------- SIGNUP / FORGOT: original centered layout ----------
  return (
    <div>
      <h2 className="text-lg font-semibold text-center mb-6 text-slate-600">
        {headerText}
      </h2>

      {MessageBanner}

      <form onSubmit={handleSubmit} className="space-y-4">
        {authMode === 'signup' && SignupFields}
        {authMode === 'forgot' && ForgotFields}
        {SubmitButton}
      </form>

      {ToggleNav}
    </div>
  );
}
