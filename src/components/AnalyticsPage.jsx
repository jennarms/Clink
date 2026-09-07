import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function StatCard({ value, label }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-sm text-center">
      <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export default function AnalyticsPage({ session, profile, onBack }) {
  const [links, setLinks] = useState([]);
  const [viewCount, setViewCount] = useState(profile?.view_count ?? 0);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!userId) return;

      const [linksResult, profileResult] = await Promise.all([
        supabase
          .from('links')
          .select('*')
          .eq('user_id', userId)
          .order('sort_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('view_count').eq('id', userId).single(),
      ]);

      if (!isMounted) return;

      if (!linksResult.error) setLinks(linksResult.data || []);
      if (!profileResult.error && profileResult.data) {
        setViewCount(profileResult.data.view_count ?? 0);
      }
      setLoading(false);
    }

    load();
    return () => { isMounted = false; };
  }, [userId]);

  const totalClicks = links.reduce((sum, l) => sum + (l.click_count || 0), 0);
  const sortedLinks = [...links].sort((a, b) => (b.click_count || 0) - (a.click_count || 0));
  const maxClicks = sortedLinks[0]?.click_count || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[#2D5A27] dark:text-[#4CAF50] hover:underline font-medium mb-4 cursor-pointer"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1">
        Analytics
      </h1>
      {profile?.username && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {window.location.host}/{profile.username}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="grid grid-cols-2 gap-3">
          <StatCard value={viewCount} label="Profile views" />
          <StatCard value={totalClicks} label="Total link clicks" />
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2D5A27]/60 dark:text-[#4CAF50]/60 px-4 pt-4 pb-2">
            Clicks by link
          </p>

          {loading ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 px-4 pb-4">Loading…</p>
          ) : sortedLinks.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 px-4 pb-4">
              No links yet — add some from the dashboard.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {sortedLinks.map((link) => {
                const clicks = link.click_count || 0;
                // A zero-click link still gets a sliver of bar (4%) so the
                // row doesn't look broken/empty next to ones that have data.
                const pct = maxClicks > 0 ? Math.max((clicks / maxClicks) * 100, clicks > 0 ? 4 : 0) : 0;

                return (
                  <div key={link.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5 gap-3">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {link.title}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                        {clicks} {clicks === 1 ? 'click' : 'clicks'}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2D5A27] dark:bg-[#4CAF50] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}