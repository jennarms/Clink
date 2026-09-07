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

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Simple views-over-time bar chart. Built the same way the "Clicks by
// link" bars below are (plain divs sized by percentage) rather than
// pulling in a charting library, since this is just a day-by-day
// count with no need for axes, zoom, or tooltips beyond a title attr.
function ViewsChart({ userId }) {
  const [range, setRange] = useState(7); // 7 or 30 days
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!userId) return;
      setLoading(true);

      const start = new Date();
      start.setDate(start.getDate() - (range - 1));
      const startStr = start.toISOString().slice(0, 10);

      const { data: rows, error } = await supabase
        .from('profile_daily_views')
        .select('view_date, view_count')
        .eq('profile_id', userId)
        .gte('view_date', startStr)
        .order('view_date', { ascending: true });

      if (!isMounted) return;

      // Fill in every day in the range — including zero-view days — so
      // the chart is always a full, evenly-spaced timeline rather than
      // only showing the days that happened to have traffic.
      const byDate = new Map((rows || []).map((r) => [r.view_date, r.view_count]));
      const filled = [];
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        filled.push({ date: key, count: byDate.get(key) || 0 });
      }

      if (!error) setData(filled);
      setLoading(false);
    }

    load();
    return () => { isMounted = false; };
  }, [userId, range]);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalInRange = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-sm p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#2D5A27]/60 dark:text-[#4CAF50]/60">
          Views over time
        </p>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs font-medium">
          {[7, 30].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 transition cursor-pointer ${
                range === r
                  ? 'bg-[#2D5A27] dark:bg-[#4CAF50] text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
          {totalInRange} {totalInRange === 1 ? 'view' : 'views'} in the last {range} days
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">Loading…</p>
      ) : totalInRange === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">
          No views yet in this range.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-[3px] h-28">
            {data.map((d) => (
              <div
                key={d.date}
                className="flex-1 rounded-t bg-[#2D5A27] dark:bg-[#4CAF50] transition-all hover:opacity-75"
                style={{ height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 6 : 2)}%` }}
                title={`${formatShortDate(d.date)}: ${d.count} ${d.count === 1 ? 'view' : 'views'}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-400 dark:text-slate-500">
            <span>{formatShortDate(data[0]?.date)}</span>
            <span>{formatShortDate(data[data.length - 1]?.date)}</span>
          </div>
        </>
      )}
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

        <div className="lg:col-span-2">
          <ViewsChart userId={userId} />
        </div>
      </div>
    </div>
  );
}