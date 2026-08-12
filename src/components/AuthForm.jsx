import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthForm() {
  // Modes: 'login' | 'signup' | 'verify'
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Login identifier (email or username)
  const [identifier, setIdentifier] = useState('');

  // Sign up fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // OTP field
  const [otp, setOtp] = useState('');

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
        hint: 'Weak password. Add numbers or symbols for better security, though simple passwords are allowed.',
      };
    }
    if (score <= 3) {
      return {
        label: 'Medium',
        color: 'text-blue-600',
        bgColor: 'bg-blue-500',
        width: 'w-2/3',
        hint: 'Good password! Add special characters to make it extra secure.',
      };
    }
    return {
      label: 'Strong',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500',
      width: 'w-full',
      hint: 'Great! That is a strong password.',
    };
  };

  const strength = getPasswordStrength(password);

  // Step 1: Handle Initial Sign Up
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    // Switch view to OTP input screen
    setAuthMode('verify');
    setMessage(`Verification code sent to ${email}. Please check your inbox.`);
  };

  // Step 2: Verify OTP and Create Profile
  const handleVerifyOtp = async () => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'signup',
    });

    if (error) throw error;

    if (data.user) {
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

      // Save profile only after successful email verification
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          username: username.trim() || email.split('@')[0],
          email: email.trim(),
          display_name: displayName,
        },
      ]);

      if (profileError) console.error('Profile creation error:', profileError.message);

      setMessage('Email verified successfully! Logging you in...');
    }
  };

  // Handle Login (Email or Username)
  const handleLogin = async () => {
    let loginEmail = identifier.trim();

    if (!loginEmail.includes('@')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', loginEmail)
        .single();

      if (profileError || !profile?.email) {
        throw new Error('Username not found or invalid.');
      }

      loginEmail = profile.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) throw error;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (authMode === 'signup') {
        await handleSignUp();
      } else if (authMode === 'verify') {
        await handleVerifyOtp();
      } else {
        await handleLogin();
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
        {authMode === 'login' && 'Welcome Back'}
        {authMode === 'signup' && 'Create an Account'}
        {authMode === 'verify' && 'Verify Your Email'}
      </h2>

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-[#2D5A27]/10 text-sm text-[#2D5A27] font-medium text-center border border-[#2D5A27]/20">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* OTP VERIFICATION VIEW */}
        {authMode === 'verify' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              6-Digit OTP Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-center tracking-widest font-mono text-lg text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
              placeholder="123456"
            />
          </div>
        )}

        {/* SIGN UP VIEW */}
        {authMode === 'signup' && (
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

              {/* NON-BLOCKING PASSWORD STRENGTH WARNING */}
              {strength && (
                <div className="mt-2 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Password strength:</span>
                    <span className={`font-semibold ${strength.color}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.bgColor} ${strength.width}`}
                    />
                  </div>
                  <p className="text-slate-500 text-[11px] leading-tight">
                    {strength.hint}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* LOGIN VIEW */}
        {authMode === 'login' && (
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
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#2D5A27] hover:bg-[#23471e] text-white font-semibold text-sm rounded-xl transition disabled:opacity-50 mt-2 cursor-pointer shadow-sm"
        >
          {loading
            ? 'Processing...'
            : authMode === 'login'
            ? 'Sign In'
            : authMode === 'signup'
            ? 'Send OTP Code'
            : 'Verify & Complete Sign Up'}
        </button>
      </form>

      <div className="mt-4 text-center">
        {authMode === 'verify' ? (
          <button
            onClick={() => {
              setAuthMode('signup');
              setMessage('');
            }}
            className="text-sm text-[#2D5A27] hover:underline cursor-pointer font-medium"
          >
            ← Back to Sign Up
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
    </div>
  );
}