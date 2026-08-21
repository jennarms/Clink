import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import AddLinkForm from './AddLinkForm';
import EditProfile from './EditProfile';
import LinkList from './LinkList';
import ShareProfileButton from './ShareProfileButton';

export default function Dashboard({ session }) {
  const [links, setLinks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const userId = session?.user?.id;
  const refetchLinks = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!userId) return;

      const [{ data: linkData, error: linkError }, { data: profileData, error: profileError }] = await Promise.all([
        supabase.from('links').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', userId).single(),
      ]);

      if (!isMounted) return;
      if (!linkError) setLinks(linkData || []);
      if (!profileError) setProfile(profileData);
    }

    loadData();
    return () => { isMounted = false; };
  }, [userId, refreshKey]);

  const handleDeleteLink = async (id) => {
    const { error } = await supabase.from('links').delete().eq('id', id);
    if (error) alert(error.message);
    else refetchLinks();
  };

  const handleLogout = async () => await supabase.auth.signOut();

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <button
          onClick={() => setEditingProfile((v) => !v)}
          className="flex items-center gap-2 text-left cursor-pointer group"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#2D5A27]/15" />
          )}
          <span className="text-sm text-slate-600 group-hover:text-[#2D5A27] truncate max-w-[140px]">
            {profile?.display_name || `@${profile?.username}`}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium text-slate-700 cursor-pointer transition-colors"
        >
          Log Out
        </button>
      </div>

      {editingProfile && (
        <EditProfile
          session={session}
          profile={profile}
          onProfileUpdated={refetchLinks}
          onClose={() => setEditingProfile(false)}
        />
      )}

      {profile?.username && <ShareProfileButton username={profile.username} />}

      <AddLinkForm userId={userId} onLinkAdded={refetchLinks} />
      <LinkList links={links} onDeleteLink={handleDeleteLink} />
    </div>
  );
}