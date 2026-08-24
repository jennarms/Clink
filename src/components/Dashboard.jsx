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
        .order('sort_order', { ascending: true, nullsFirst: false })
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

  const handleUpdateLink = (id, patch) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const handleReorderLinks = async (newLinks) => {
    setLinks(newLinks); // optimistic — reorder feels instant

    const updates = newLinks.map((link, index) =>
      supabase.from('links').update({ sort_order: index }).eq('id', link.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);

    if (failed) {
      alert(failed.error.message);
      refetchLinks(); // re-sync with the server if a write failed partway
    }
  };

  return (
    <div>
      {profile?.username && (
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <ShareProfileButton username={profile.username} />
          </div>
          <a
            href={`/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap py-2.5 bg-white dark:bg-slate-800 border border-[#2D5A27] dark:border-[#4CAF50] hover:bg-[#2D5A27]/5 dark:hover:bg-[#4CAF50]/10 text-[#2D5A27] dark:text-[#4CAF50] font-medium text-sm rounded-xl transition cursor-pointer shadow-sm mb-4"
            title="Opens your public page in a new tab, exactly as visitors see it"
          >
            Preview
          </a>
        </div>
      )}
      <AddLinkForm userId={userId} onLinkAdded={refetchLinks} />
      <LinkList
        links={links}
        userId={userId}
        onDeleteLink={handleDeleteLink}
        onUpdateLink={handleUpdateLink}
        onReorderLinks={handleReorderLinks}
      />
    </div>
  );
}