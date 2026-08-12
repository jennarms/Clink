import { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import ResetPassword from './components/ResetPassword';
import { supabase } from './supabaseClient';

export default function App() {
  const [session, setSession] = useState(null);
  const [isResettingPassword, setIsResettingPassword] = useState(
    window.location.pathname === '/reset-password'
  );

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

  return (
    <div className="min-h-screen bg-[#F9F8F3] text-[#1A1A1A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold text-center text-[#2D5A27] mb-2 flex items-center justify-center gap-2">
          Linkie 🔗
        </h1>

        {
          
        }
        {isResettingPassword ? (
          <ResetPassword onComplete={() => setIsResettingPassword(false)} />
        ) : !session ? (
          <AuthForm />
        ) : (
          <Dashboard session={session} />
        )}
      </div>
    </div>
  );
}