import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import RenderIcon from './RenderIcon';

function cardStyle(accent, style) {
  if (style === 'outline') {
    return { background: '#fff', border: '1.5px solid ' + accent, color: accent };
  }
  if (style === 'soft') {
    return { background: accent + '14', border: '1px solid ' + accent + '33', color: accent };
  }
  return { background: accent, border: '1px solid ' + accent, color: '#fff' };
}

export default function PublicProfile({ username }) {
  const [status, setStatus] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);

  // Tracks the OS-level preference only. We don't setState synchronously
  // for the 'light'/'dark' cases — those are derived directly below,
  // which avoids the react-hooks/set-state-in-effect lint warning.
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, theme_color, theme_mode')
        .eq('username', username)
        .single();

      if (!isMounted) return;

      if (profileError || !profileData) {
        setStatus('not-found');
        return;
      }

      setProfile(profileData);

      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('id, title, url, description, icon, accent_color, style, image_url')
        .eq('user_id', profileData.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (!isMounted) return;

      if (!linksError) {
        setLinks(linksData || []);
      }
      setStatus('found');
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [username]);

  // Subscribes to OS theme changes only — no setState call on mount,
  // just registering a listener for future changes.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemPrefersDark(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F9F8F3] flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen bg-[#F9F8F3] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-[#2D5A27] mb-2">Linkie</h1>
        <p className="text-slate-600 mb-1">There is no page at /{username}.</p>
        <a href="/" className="text-sm text-[#2D5A27] hover:underline font-medium">
          Go to Linkie home
        </a>
      </div>
    );
  }

  const mode = profile.theme_mode || 'system';
  const isDark = mode === 'system' ? systemPrefersDark : mode === 'dark';

  const pageBg = isDark ? '#0F172A' : '#F9F8F3';
  const nameColor = isDark ? '#F1F5F9' : '#1A1A1A';
  const handleColor = isDark ? '#94A3B8' : '#64748B';
  const bioColor = isDark ? '#CBD5E1' : '#475569';
  const footerColor = isDark ? '#475569' : '#CBD5E1';
  const displayName = profile.display_name || '@' + profile.username;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-14 transition-colors" style={{ background: pageBg }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="w-20 h-20 rounded-full object-cover border border-slate-200 mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#2D5A27]/15 mb-4" />
          )}
          <h1 className="text-xl font-bold" style={{ color: nameColor }}>
            {displayName}
          </h1>
          <p className="text-sm" style={{ color: handleColor }}>@{profile.username}</p>
          {profile.bio && (
            <p className="text-sm mt-2 max-w-xs" style={{ color: bioColor }}>{profile.bio}</p>
          )}
        </div>

        {links.length === 0 ? (
          <p className="text-xs text-slate-400 text-center">No links here yet.</p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => {
              const accent = link.accent_color || '#2D5A27';
              const style = link.style || 'solid';
              const boxStyle = cardStyle(accent, style);
              const iconBg = style === 'solid' ? 'rgba(255,255,255,0.2)' : accent + '1A';

              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full py-3 px-4 rounded-xl font-medium text-sm shadow-sm transition-transform hover:-translate-y-0.5"
                  style={boxStyle}
                >
                  {link.image_url ? (
                    <img
                      src={link.image_url}
                      alt=""
                      className="w-11 h-11 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span
                      className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-base leading-none"
                      style={{ background: iconBg }}
                    >
                      <RenderIcon iconKey={link.icon} className="w-5 h-5" />
                    </span>
                  )}
                  <div className="min-w-0 text-left">
                    <div className="truncate">{link.title}</div>
                    {link.description && (
                      <div className="text-xs truncate mt-0.5" style={{ opacity: 0.85 }}>
                        {link.description}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <p className="text-center text-[11px] mt-10" style={{ color: footerColor }}>
          Made with Linkie
        </p>
      </div>
    </div>
  );
}