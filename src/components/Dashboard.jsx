import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import AddLinkForm from './AddLinkForm';
import LinkList from './LinkList';

export default function Dashboard({ session }) {
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

      if (isMounted) {
        if (error) {
          console.error('Error fetching links:', error.message);
        } else {
          setLinks(data || []);
        }
      }
    }

    loadLinks();

    return () => {
      isMounted = false;
    };
  }, [userId, refreshKey]);

  const handleDeleteLink = async (id) => {
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
    } else {
      refetchLinks();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <span className="text-sm text-slate-500 truncate max-w-[200px]">
          {session?.user?.email}
        </span>
        <button
          onClick={handleLogout}
          className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium text-slate-700 cursor-pointer transition-colors"
        >
          Log Out
        </button>
      </div>

      <AddLinkForm userId={userId} onLinkAdded={refetchLinks} />
      <LinkList links={links} onDeleteLink={handleDeleteLink} />
    </div>
  );
}