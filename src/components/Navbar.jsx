import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Navbar({ profile, onEditProfile }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <span className="font-bold text-[#2D5A27] text-xl">Linkie 🔗</span>

          <div className="hidden sm:flex items-center gap-6">
            <button
              onClick={onEditProfile}
              className="flex items-center gap-3 text-base text-slate-600 hover:text-[#2D5A27] transition-colors cursor-pointer"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#2D5A27]/15" />
              )}
              <span className="truncate max-w-[180px] font-medium">
                {profile?.display_name || (profile?.username ? `@${profile.username}` : '')}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-lg font-medium text-slate-700 cursor-pointer transition-colors"
            >
              Log Out
            </button>
          </div>

          <button
            className="sm:hidden p-2.5 -mr-2.5 text-slate-600 cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden pb-5 flex flex-col gap-4 border-t border-slate-100 pt-4">
            <button
              onClick={() => { setMenuOpen(false); onEditProfile(); }}
              className="flex items-center gap-3 text-base text-slate-600 cursor-pointer"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#2D5A27]/15" />
              )}
              <span className="font-medium">
                {profile?.display_name || (profile?.username ? `@${profile.username}` : '')}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="text-sm bg-slate-100 px-4 py-2.5 rounded-lg font-medium text-slate-700 text-left cursor-pointer"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}