import EditProfile from './EditProfile';

export default function EditProfilePage({ session, profile, onDone, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#2D5A27] mb-6 cursor-pointer"
      >
        ← Back to Dashboard
      </button>

      <EditProfile session={session} profile={profile} onProfileUpdated={onDone} />
    </div>
  );
}