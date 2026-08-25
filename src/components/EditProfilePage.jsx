import EditProfile from './EditProfile';

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[#2D5A27]/60 dark:text-[#4CAF50]/60 mb-2 px-0.5">
      {children}
    </p>
  );
}

export default function EditProfilePage({ session, profile, onDone, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 hover:text-[#2D5A27] dark:hover:text-[#4CAF50] mb-6 cursor-pointer transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] dark:focus-visible:ring-[#4CAF50]"
      >
        ← Back to Dashboard
      </button>

      <SectionLabel>Edit profile</SectionLabel>
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-sm">
        <EditProfile session={session} profile={profile} onProfileUpdated={onDone} />
      </div>
    </div>
  );
}