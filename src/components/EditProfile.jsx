import { useState } from 'react';
import { supabase } from '../supabaseClient';

const USERNAME_COOLDOWN_DAYS = 30;

function daysRemaining(lastChanged) {
  if (!lastChanged) return 0;
  const elapsedMs = Date.now() - new Date(lastChanged).getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(USERNAME_COOLDOWN_DAYS - elapsedDays));
}

export default function EditProfile({ session, profile, onProfileUpdated, onClose }) {
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

      // Upload new avatar if one was picked
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${userId}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);

        // cache-bust so the new image shows immediately
        finalAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      }

      const updates = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatarUrl || null,
        username: username.trim(),
      };

      // Only stamp the cooldown timer if the username actually changed
      if (usernameChanged) {
        updates.username_updated_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        // Postgres unique violation on username
        if (updateError.code === '23505') {
          throw new Error('That username is already taken.');
        }
        throw updateError;
      }

      onProfileUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 text-sm">Edit Profile</h3>
        <button type="button" onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
          Cancel
        </button>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-3">
        {avatarPreview ? (
          <img src={avatarPreview} alt="Avatar preview" className="w-14 h-14 rounded-full object-cover border border-slate-200" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#2D5A27]/15" />
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#2D5A27] cursor-pointer hover:underline">
            Change photo
            <input type="file" accept="image/*" onChange={handleAvatarPick} className="hidden" />
          </label>
          {avatarPreview && (
            <button type="button" onClick={handleRemoveAvatar} className="text-xs text-slate-400 hover:text-red-500 cursor-pointer text-left">
              Remove photo
            </button>
          )}
        </div>
      </div>

      {/* Display name */}
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Nickname</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How you want to be shown"
          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]"
        />
      </div>

      {/* Username */}
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]"
        />
        {usernameChanged && cooldownDaysLeft > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            You can only change your username once a month — {cooldownDaysLeft} day(s) left.
          </p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="A short line about you"
          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]"
        />
        <p className="text-[11px] text-slate-400 text-right mt-1">{bio.length}/160</p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 bg-[#2D5A27] hover:bg-[#23471e] disabled:opacity-50 text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-sm"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}