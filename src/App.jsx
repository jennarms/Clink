import { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import PublicProfile from './components/PublicProfile';
import ResetPassword from './components/ResetPassword';
import { supabase } from './supabaseClient';

// Paths that belong to the app itself, not to a username. Anything
// NOT in this list is treated as a public profile lookup — so if you
// add new app routes later (e.g. a settings page), add them here too,
// or they'll be swallowed by the username catch-all.
const RESERVED_PATHS = ['/', '/reset-password'];

export default function App() {
  const [session, setSession] = useState(null);
  const [isResettingPassword, setIsResettingPassword] = useState(
    window.location.pathname === '/reset-password'
  );

  const pathname = window.location.pathname;
  const isPublicProfileRoute = !RESERVED_PATHS.includes(pathname);
  const usernameFromPath = isPublicProfileRoute ? pathname.slice(1) : null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Public profile pages (linkie.com/rob) render standalone — no auth
  // needed, no app chrome, and works whether or not anyone is logged in.
  if (isPublicProfileRoute) {
    return <PublicProfile username={usernameFromPath} />;
  }

  if (isResettingPassword) {
    return (
      <div className="min-h-screen bg-[#F9F8F3] text-[#1A1A1A] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-bold text-center text-[#2D5A27] mb-2 flex items-center justify-center gap-2">
            Linkie 🔗
          </h1>
          <ResetPassword onComplete={() => setIsResettingPassword(false)} />
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen bg-[#F9F8F3] text-[#1A1A1A] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-bold text-center text-[#2D5A27] mb-2 flex items-center justify-center gap-2">
            Linkie 🔗
          </h1>
          <Dashboard session={session} />
        </div>
      </div>
    );
  }

  // Logged out: AuthForm now owns its own full-page layout for every
  // mode (login/signup/forgot) instead of being boxed into a fixed
  // max-w-md card here — that's what was clipping the split-screen
  // login to a narrow column no matter the screen size.
  return <AuthForm />;
}