import { useEffect, useState } from 'react';
import { PrivacyPolicy, TermsOfService } from './components/AboutWebsite';
import AccountSettings from './components/AccountSettings';
import AuthForm from './components/AuthForm';
import ConfirmDeleteAccount from './components/confirm-delete-account';
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
const RESERVED_PATHS = [
  '/',
  '/reset-password',
  '/edit-profile',
  '/account-settings',
  '/confirm-delete-account',
  '/terms',
  '/privacy',
];

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
  const [isAccountSettings, setIsAccountSettings] = useState(
    window.location.pathname === '/account-settings'
  );
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(
    window.location.pathname === '/confirm-delete-account'
  );
  const [isViewingTerms, setIsViewingTerms] = useState(
    window.location.pathname === '/terms'
  );
  const [isViewingPrivacy, setIsViewingPrivacy] = useState(
    window.location.pathname === '/privacy'
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
      if (event === 'SIGNED_IN') {
        // Always land on the dashboard after logging in or signing up,
        // no matter which page (e.g. /terms, /privacy) they came from.
        window.history.pushState({}, '', '/');
        setIsResettingPassword(false);
        setIsEditingProfile(false);
        setIsAccountSettings(false);
        setIsConfirmingDeletion(false);
        setIsViewingTerms(false);
        setIsViewingPrivacy(false);
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

  // Pulls the latest user record from the Supabase SERVER (not local
  // cache) so a confirmed email change shows up even if it was
  // confirmed in a different browser/tab.
  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data?.session) {
      setSession(data.session);
    } else {
      // Refresh token may be temporarily stale right after an email
      // change — fall back to whatever's currently cached instead.
      const { data: fallback } = await supabase.auth.getSession();
      if (fallback?.session) setSession(fallback.session);
    }
  };

  const goToDashboard = () => {
    window.history.pushState({}, '', '/');
    setIsEditingProfile(false);
    setIsAccountSettings(false);
    setIsConfirmingDeletion(false);
    setIsViewingTerms(false);
    setIsViewingPrivacy(false);
  };

  const goToEditProfile = () => {
    window.history.pushState({}, '', '/edit-profile');
    setIsEditingProfile(true);
    setIsAccountSettings(false);
  };

  const goToAccountSettings = () => {
    window.history.pushState({}, '', '/account-settings');
    setIsAccountSettings(true);
    setIsEditingProfile(false);
    refreshSession(); // catch any email confirmation that happened elsewhere
  };

  const handleProfileSaved = () => {
    setProfileVersion((v) => v + 1); // triggers refetch so navbar updates
    goToDashboard();
  };

  // Called after DeleteAccount successfully removes the user's row.
  // Signs the app back to a logged-out state and resets the URL.
  const handleAccountDeleted = () => {
    window.history.pushState({}, '', '/');
    setSession(null);
    setProfile(null);
    setIsAccountSettings(false);
    setIsEditingProfile(false);
    setIsConfirmingDeletion(false);
  };

  // Confirming account deletion via the link the user was emailed. This
  // must be checked before the public-profile catch-all below (handled by
  // RESERVED_PATHS) and works regardless of whether `session` has been
  // populated yet — ConfirmDeleteAccount manages that itself.
  if (isConfirmingDeletion) {
    return (
      <ConfirmDeleteAccount
        onAccountDeleted={handleAccountDeleted}
        onCancel={goToDashboard}
      />
    );
  }

  // Terms of Service and Privacy Policy render standalone — no auth
  // needed, works whether or not anyone is logged in (e.g. someone
  // reading them before creating an account, from a link in AuthForm).
  if (isViewingTerms || isViewingPrivacy) {
    return (
      <div className="min-h-screen bg-[#F9F8F3] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100 flex flex-col items-center p-4 pt-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          {isViewingTerms ? (
            <TermsOfService onBack={goToDashboard} />
          ) : (
            <PrivacyPolicy onBack={goToDashboard} />
          )}
        </div>
      </div>
    );
  }

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
        <Navbar profile={profile} onAccountSettings={goToAccountSettings} onLogoClick={goToDashboard} />
        <div className="flex flex-col items-center p-4 pt-8">
          <div
            className={`w-full bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 ${
              isEditingProfile || isAccountSettings ? 'max-w-md' : 'max-w-5xl'
            }`}
          >
            {isEditingProfile ? (
              <EditProfilePage
                session={session}
                profile={profile}
                onDone={handleProfileSaved}
                onBack={goToDashboard}
              />
            ) : isAccountSettings ? (
              <AccountSettings
                profile={{ ...profile, email: session.user.email }}
                onBack={goToDashboard}
                onRefreshSession={refreshSession}
                onAccountDeleted={handleAccountDeleted}
              />
            ) : (
              <Dashboard session={session} profile={profile} onEditProfile={goToEditProfile} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Logged out: AuthForm owns its own full-page layout.
  return <AuthForm />;
}