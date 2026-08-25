import { useEffect, useState } from 'react';
import { cardStyle, luminance } from '../lib/linkStyles';
import { supabase } from '../supabaseClient';
import RenderIcon from './RenderIcon';
import SpotifyEmbed from './SpotifyEmbed';

const DEFAULT_BG = '#F9F8F3';

export default function PublicProfile({ username }) {
  const [status, setStatus] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, theme_color, background_type, background_value, spotify_url')
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

  const bgType = profile.background_type || 'color';
  const bgValue = profile.background_value || profile.theme_color || DEFAULT_BG;
  const isImageBg = bgType === 'image' && !!bgValue;

  const pageBg = isImageBg ? DEFAULT_BG : bgValue;
  const isDark = isImageBg ? false : luminance(pageBg) < 0.5;

  const nameColor = isDark ? '#F1F5F9' : '#1A1A1A';
  const handleColor = isDark ? '#94A3B8' : '#64748B';
  const bioColor = isDark ? '#CBD5E1' : '#475569';
  const footerColor = isDark ? '#475569' : '#CBD5E1';
  const avatarBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const avatarFallbackBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(45,90,39,0.15)';
  const displayName = profile.display_name || '@' + profile.username; 

  const pageStyle = isImageBg
    ? {
        backgroundImage: `url(${bgValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : { background: pageBg };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-14 transition-colors" style={pageStyle}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="w-20 h-20 rounded-full object-cover mb-4"
              style={{ border: `1px solid ${avatarBorder}` }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full mb-4" style={{ background: avatarFallbackBg }} />
          )}
          <h1 className="text-xl font-bold" style={{ color: nameColor }}>
            {displayName}
          </h1>
          <p className="text-sm" style={{ color: handleColor }}>@{profile.username}</p>
          {profile.bio && (
            <p className="text-sm mt-2 max-w-xs" style={{ color: bioColor }}>{profile.bio}</p>
          )}
        </div>

        {profile.spotify_url && (
          <SpotifyEmbed url={profile.spotify_url} label={false} className="mb-6" />
        )}

        {links.length === 0 ? (
          <p className="text-xs text-center" style={{ color: handleColor }}>No links here yet.</p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => {
              const accent = link.accent_color || '#2D5A27';
              const style = link.style || 'solid';
              const boxStyle = cardStyle(accent, style, isDark);
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