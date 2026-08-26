import { useState } from 'react';
import AboutWebsite from './AboutWebsite';
import ChangeEmail from './ChangeEmail';
import DeleteAccount from './DeleteAccount';
import ResetPassword from './ResetPassword';

const MENU = 'menu';
const EMAIL = 'email';
const PASSWORD = 'password';
const ABOUT = 'about';
const DELETE = 'delete';

export default function AccountSettings({ profile, onBack, onRefreshSession, onAccountDeleted }) {
  const [view, setView] = useState(MENU);

  if (view === EMAIL) {
    return (
      <ChangeEmail
        profile={profile}
        onComplete={() => setView(MENU)}
        onRefreshSession={onRefreshSession}
      />
    );
  }
  if (view === PASSWORD) {
    return <ResetPassword onComplete={() => setView(MENU)} />;
  }
  if (view === ABOUT) {
    return <AboutWebsite onComplete={() => setView(MENU)} />;
  }
  if (view === DELETE) {
    return <DeleteAccount onComplete={() => setView(MENU)} onAccountDeleted={onAccountDeleted} />;
  }

  const items = [
    {
      key: EMAIL,
      label: 'Change Email',
      desc: profile?.email || 'Update your login email',
      onClick: () => setView(EMAIL),
    },
    {
      key: PASSWORD,
      label: 'Change Password',
      desc: 'Update your account password',
      onClick: () => setView(PASSWORD),
    },
    {
      key: ABOUT,
      label: 'About Website',
      desc: 'Version, terms, contact info',
      onClick: () => setView(ABOUT),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center pt-2 pb-1">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Account Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={item.onClick}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div>
              <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{item.label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">{item.desc}</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 shrink-0">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>

      {/* Danger zone — visually separated from the rest of the menu */}
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
        <button
          onClick={() => setView(DELETE)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
        >
          <div>
            <div className="font-medium text-sm text-red-600 dark:text-red-400">Delete Account</div>
            <div className="text-xs text-red-400 dark:text-red-500/80">Permanently remove your account and data</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-300 shrink-0">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-700">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-[#2D5A27] hover:underline cursor-pointer font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}