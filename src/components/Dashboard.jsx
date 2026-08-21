import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import AddLinkForm from './AddLinkForm';
import LinkList from './LinkList';
import ShareProfileButton from './ShareProfileButton';

export default function Dashboard({ session, profile }) {
  const [links, setLinks] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const userId = session?.user?.id;
  const refetchLinks = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    let isMounted = true;

    async function loadLinks() {
      if (!userId) return;
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (isMounted && !error) setLinks(data || []);
    }

    loadLinks();
    return () => { isMounted = false; };
  }, [userId, refreshKey]);

  const handleDeleteLink = async (id) => {
    const { error } = await supabase.from('links').delete().eq('id', id);
    if (error) alert(error.message);
    else refetchLinks();
  };

  return (
    <div>
      {profile?.username && <ShareProfileButton username={profile.username} />}
      <AddLinkForm userId={userId} onLinkAdded={refetchLinks} />
      <LinkList links={links} onDeleteLink={handleDeleteLink} />
    </div>
  );
}