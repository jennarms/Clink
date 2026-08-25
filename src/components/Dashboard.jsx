import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import AddLinkForm from './AddLinkForm';
import BackgroundColorPicker from './BackgroundColorPicker';
import LinkList from './LinkList';
import PagePreviewCard from './PagePreviewCard';
import ShareProfileButton from './ShareProfileButton';

const LONG_PRESS_MS = 450;

// Small reusable label used above each functional group (Profile,
// Appearance, Links) so the dashboard reads as distinct sections
// instead of one undifferentiated stack.
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[#2D5A27]/60 dark:text-[#4CAF50]/60 mb-2 px-0.5">
      {children}
    </p>
  );
}

export default function Dashboard({ session, profile }) {
  const [links, setLinks] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const profileBgType = profile?.background_type || 'color';
  const profileBgValue = profile?.background_value || profile?.theme_color;

  const [previewBackground, setPreviewBackground] = useState({
    type: profileBgType,
    value: profileBgValue,
  });

  const [syncedFrom, setSyncedFrom] = useState({
    type: profileBgType,
    value: profileBgValue,
  });

  if (profileBgType !== syncedFrom.type || profileBgValue !== syncedFrom.value) {
    setSyncedFrom({ type: profileBgType, value: profileBgValue });
    setPreviewBackground({ type: profileBgType, value: profileBgValue });
  }

  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

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
    setLinks(newLinks); // optimistic

    const updates = newLinks.map((link, index) =>
      supabase.from('links').update({ sort_order: index }).eq('id', link.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);

    if (failed) {
      alert(failed.error.message);
      refetchLinks();
    }
  };

  const startLongPress = () => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowPreview(true);
    }, LONG_PRESS_MS);
  };

  const cancelLongPressTimer = () => {
    clearTimeout(longPressTimer.current);
  };

  const endLongPress = () => {
    cancelLongPressTimer();
    setShowPreview(false);
  };

  const handlePreviewClick = (e) => {
    if (longPressTriggered.current) {
      e.preventDefault();
      longPressTriggered.current = false;
    }
  };

  const previewProfile = {
    ...profile,
    background_type: previewBackground.type,
    background_value: previewBackground.value,
  };

  return (
    <div>
      {/* Dashboard header — grounds the screen with a title and live
          link count, which the old layout had no equivalent of. */}
      {profile?.username && (
        <div className="flex items-baseline justify-between mb-6 px-0.5">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Your page
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {window.location.host}/{profile.username} · {links.length} {links.length === 1 ? 'link' : 'links'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          {profile?.username && (
            <>
              {/* Profile section */}
              <div>
                <SectionLabel>Profile</SectionLabel>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-sm">
                  <div className="flex flex-col items-center text-center gap-2 mb-4">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name || profile.username}
                        className="w-20 h-20 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#2D5A27]/15 dark:bg-[#4CAF50]/15" />
                    )}
                    <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                      {profile.display_name || profile.username}
                    </h2>
                    {profile.bio && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex items-stretch gap-2">
                    <div className="flex-1">
                      <ShareProfileButton username={profile.username} />
                    </div>

                    <div className="relative flex-1">
                      <a
                        href={`/${profile.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onMouseEnter={() => setShowPreview(true)}
                        onMouseLeave={() => setShowPreview(false)}
                        onTouchStart={startLongPress}
                        onTouchEnd={endLongPress}
                        onTouchCancel={endLongPress}
                        onClick={handlePreviewClick}
                        className="w-full h-full flex items-center justify-center gap-1.5 whitespace-nowrap py-2.5 bg-white dark:bg-slate-800 border border-[#2D5A27] dark:border-[#4CAF50] hover:bg-[#2D5A27]/5 dark:hover:bg-[#4CAF50]/10 text-[#2D5A27] dark:text-[#4CAF50] font-medium text-sm rounded-xl transition cursor-pointer shadow-sm"
                        title="Hover (or press and hold on mobile) to preview — click to open in a new tab"
                      >
                        Preview
                      </a>

                      {showPreview && (
                        <div className="absolute z-50 top-full right-0 mt-2">
                          <PagePreviewCard profile={previewProfile} links={links} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Appearance section */}
              <div>
                <SectionLabel>Appearance</SectionLabel>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden">
                  <BackgroundColorPicker
                    userId={userId}
                    initialType={profile.background_type}
                    initialValue={profile.background_value || profile.theme_color}
                    onChange={setPreviewBackground}
                    onSaved={setPreviewBackground}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Links section */}
        <div>
          <SectionLabel>Links</SectionLabel>
          <div className="space-y-3">
            <AddLinkForm userId={userId} onLinkAdded={refetchLinks} />

            {links.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  No links yet
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Add your first link above — it'll show up on your page right away.
                </p>
              </div>
            ) : (
              <LinkList
                links={links}
                userId={userId}
                onDeleteLink={handleDeleteLink}
                onUpdateLink={handleUpdateLink}
                onReorderLinks={handleReorderLinks}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}