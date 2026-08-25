import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import ConfirmDialog from './ConfirmDialog';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar({ profile, onEditProfile, onLogoClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await supabase.auth.signOut();
  };

  const displayName = profile?.display_name || (profile?.username ? `@${profile.username}` : '');

  // Close the mobile menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <button
              onClick={onLogoClick}
              className="font-bold text-[#2D5A27] dark:text-[#4CAF50] text-lg sm:text-xl cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] dark:focus-visible:ring-[#4CAF50] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              Linkie 🔗
            </button>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-6">
              <button
                onClick={onEditProfile}
                className="flex items-center gap-3 text-base text-slate-600 dark:text-slate-300 hover:text-[#2D5A27] dark:hover:text-[#4CAF50] transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] dark:focus-visible:ring-[#4CAF50] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#2D5A27]/15" />
                )}
                {displayName && <span className="truncate max-w-[180px] font-medium">{displayName}</span>}
              </button>
              <DarkModeToggle />
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] dark:focus-visible:ring-[#4CAF50] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                Log Out
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              className="sm:hidden p-2 -mr-2 text-slate-600 dark:text-slate-300 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] dark:focus-visible:ring-[#4CAF50]"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div ref={menuRef} className="sm:hidden border-t border-slate-100 dark:border-slate-700 px-4 py-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEditProfile();
                }}
                className="w-full flex items-center gap-3 text-base text-slate-700 dark:text-slate-200 cursor-pointer px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#2D5A27]/15 flex-shrink-0" />
                )}
                <span className="font-medium truncate">{displayName || 'Edit profile'}</span>
              </button>

              <div className="flex items-center justify-between px-3 py-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Dark mode</span>
                <DarkModeToggle />
              </div>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full text-sm font-medium text-slate-700 dark:text-slate-200 text-left cursor-pointer px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}