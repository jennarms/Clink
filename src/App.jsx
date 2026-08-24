import { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import EditProfilePage from './components/EditProfilePage';
import Navbar from './components/Navbar';
import PublicProfile from './components/PublicProfile';
import ResetPassword from './components/ResetPassword';
import { supabase } from './supabaseClient';

// Paths that belong to the app itself, not to a username. Anything
// NOT in this list is treated as a public profile lookup — so if you
// add new app routes later, add them here too, or they'll be
// swallowed by the username catch-all.
const RESERVED_PATHS = ['/', '/reset-password', '/edit-profile'];

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const [isResettingPassword, setIsResettingPassword] = useState(
    window.location.pathname === '/reset-password'
  );
  const [isEditingProfile, setIsEditingProfile] = useState(
    window.location.pathname === '/edit-profile'
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

  // Load the profile row whenever the session changes, or when
  // EditProfilePage tells us it saved (via profileVersion bump).
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (isMounted && !error) setProfile(data);
    }

    loadProfile();
    return () => { isMounted = false; };
  }, [session, profileVersion]);

  const goToDashboard = () => {
    window.history.pushState({}, '', '/');
    setIsEditingProfile(false);
  };

  const goToEditProfile = () => {
    window.history.pushState({}, '', '/edit-profile');
    setIsEditingProfile(true);
  };

  const handleProfileSaved = () => {
    setProfileVersion((v) => v + 1); // triggers refetch so navbar updates
    goToDashboard();
  };

  // Public profile pages (linkie.com/rob) render standalone — no auth
  // needed, no app chrome, and works whether or not anyone is logged in.
  if (isPublicProfileRoute) {
    return <PublicProfile username={usernameFromPath} />;
  }

  if (isResettingPassword) {
    return (
      <div className="min-h-screen bg-[#F9F8F3] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
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
      <div className="min-h-screen bg-[#F9F8F3] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100">
        <Navbar profile={profile} onEditProfile={goToEditProfile} onLogoClick={goToDashboard} />
         <div className="flex flex-col items-center p-4 pt-8">
             <div className="w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            {isEditingProfile ? (
              <EditProfilePage
                session={session}
                profile={profile}
                onDone={handleProfileSaved}
                onBack={goToDashboard}
              />
            ) : (
              <Dashboard session={session} profile={profile} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Logged out: AuthForm owns its own full-page layout.
  return <AuthForm />;
}