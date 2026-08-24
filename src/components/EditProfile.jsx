import { useState } from 'react';
import { supabase } from '../supabaseClient';

const USERNAME_COOLDOWN_DAYS = 30;

function daysRemaining(lastChanged) {
  if (!lastChanged) return 0;
  const elapsedMs = Date.now() - new Date(lastChanged).getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(USERNAME_COOLDOWN_DAYS - elapsedDays));
}

export default function EditProfile({ session, profile, onProfileUpdated }) {
  const userId = session?.user?.id;

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const usernameChanged = username !== profile?.username;
  const cooldownDaysLeft = daysRemaining(profile?.username_updated_at);
  const usernameLocked = usernameChanged && cooldownDaysLeft > 0;

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarUrl('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (usernameLocked) {
      setError(`You can change your username again in ${cooldownDaysLeft} day(s).`);
      return;
    }
    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${userId}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
        finalAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      }

      const updates = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatarUrl || null,
        username: username.trim(),
      };

      if (usernameChanged) {
        updates.username_updated_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('That username is already taken.');
        }
        throw updateError;
      }

      onProfileUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-base">Edit Profile</h3>

      <div className="flex items-center gap-3">
        {avatarPreview ? (
          <img src={avatarPreview} alt="Avatar preview" className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#2D5A27]/15 dark:bg-[#4CAF50]/15" />
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#2D5A27] dark:text-[#4CAF50] cursor-pointer hover:underline">
            Change photo
            <input type="file" accept="image/*" onChange={handleAvatarPick} className="hidden" />
          </label>
          {avatarPreview && (
            <button type="button" onClick={handleRemoveAvatar} className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 cursor-pointer text-left">
              Remove photo
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Nickname</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How you want to be shown"
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-[#1A1A1A] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 dark:focus:ring-[#4CAF50]/30 focus:border-[#2D5A27] dark:focus:border-[#4CAF50]"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-[#1A1A1A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 dark:focus:ring-[#4CAF50]/30 focus:border-[#2D5A27] dark:focus:border-[#4CAF50]"
        />
        {usernameChanged && cooldownDaysLeft > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            You can only change your username once a month — {cooldownDaysLeft} day(s) left.
          </p>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="A short line about you"
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-[#1A1A1A] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 dark:focus:ring-[#4CAF50]/30 focus:border-[#2D5A27] dark:focus:border-[#4CAF50]"
        />
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-right mt-1">{bio.length}/160</p>
      </div>

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 bg-[#2D5A27] hover:bg-[#23471e] dark:bg-[#4CAF50] dark:hover:bg-[#3d9142] disabled:opacity-50 text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-sm"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}