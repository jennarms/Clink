import { useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import ConfirmDialog from './ConfirmDialog';
import ImageCropModal from './ImageCropModal';

const USERNAME_COOLDOWN_DAYS = 30;

function daysRemaining(lastChanged) {
  if (!lastChanged) return 0;
  const elapsedMs = Date.now() - new Date(lastChanged).getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(USERNAME_COOLDOWN_DAYS - elapsedDays));
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[#2D5A27]/60 dark:text-[#4CAF50]/60 mb-2 px-0.5">
      {children}
    </p>
  );
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

  // Picked-but-not-yet-cropped image, shown in ImageCropModal.
  const [cropSrc, setCropSrc] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const usernameChanged = username !== profile?.username;
  const cooldownDaysLeft = daysRemaining(profile?.username_updated_at);
  const usernameLocked = usernameChanged && cooldownDaysLeft > 0;

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    // Reset so picking the same file again still fires onChange.
    e.target.value = '';
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleCropConfirm = (blob) => {
    const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(blob));
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarUrl('');
    setShowRemoveConfirm(false);
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
    <>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <SectionLabel>Profile details</SectionLabel>

          <div className="flex items-center gap-4">
            <label className="relative group w-24 h-24 rounded-full cursor-pointer flex-shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#2D5A27]/15 dark:bg-[#4CAF50]/15" />
              )}
              <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/45 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium text-center px-2">
                  {avatarPreview ? 'Change photo' : 'Add photo'}
                </span>
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarPick}
                className="hidden"
              />
            </label>

            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {displayName || 'Your photo'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">PNG or JPG, square works best</p>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(true)}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 cursor-pointer text-left mt-1"
                >
                  Remove photo
                </button>
              )}
            </div>
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
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {window.location.host}/{username || 'username'} — changing this breaks any link you've already shared.
          </p>
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
          className="w-full py-2.5 bg-[#2D5A27] hover:bg-[#23471e] dark:bg-[#4CAF50] dark:hover:bg-[#3d9142] disabled:opacity-50 text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] dark:focus-visible:ring-[#4CAF50] focus-visible:ring-offset-2"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {cropSrc && (
        <ImageCropModal src={cropSrc} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />
      )}

      <ConfirmDialog
        open={showRemoveConfirm}
        title="Remove profile photo?"
        message="Your page will show a default avatar until you add a new one."
        confirmLabel="Remove photo"
        danger
        onConfirm={handleRemoveAvatar}
        onCancel={() => setShowRemoveConfirm(false)}
      />
    </>
  );
}