import { useEffect, useRef, useState } from 'react';
import { cardStyle, luminance } from '../lib/linkStyles';
import { supabase } from '../supabaseClient';
import RenderIcon from './RenderIcon';
import ShareProfileButton from './ShareProfileButton';
import SpotifyEmbed from './SpotifyEmbed';

const DEFAULT_BG = '#F9F8F3';

function getInitials(name) {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col items-center px-4 py-14">
      <div className="w-full max-w-sm animate-pulse">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-black/10 mb-4" />
          <div className="h-5 w-32 rounded bg-black/10 mb-2" />
          <div className="h-3 w-20 rounded bg-black/10" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 w-full rounded-xl bg-black/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PublicProfile({ username }) {
  const [status, setStatus] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [revealed, setRevealed] = useState(false);

  // The Dashboard's "Preview" button opens this exact same route in a
  // new tab, so without a flag there's no way to tell a real visitor
  // apart from the owner checking their own page. That flag disables
  // both view and click tracking below.
  const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';

  // Guards against double-firing the view increment — React 18 Strict
  // Mode runs effects twice in dev, and this is the kind of side effect
  // (a write) that shouldn't run twice just because of that.
  const hasTrackedView = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, theme_color, background_type, background_value, spotify_url, view_count, show_view_count')
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

  // Trigger the entrance fade/slide once content is ready, on the next
  // frame so the transition actually animates instead of snapping in.
  useEffect(() => {
    if (status === 'found') {
      const id = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(id);
    }
  }, [status]);

  // Fire-and-forget view tracking. This intentionally doesn't block or
  // affect rendering in any way — if it fails (offline, RPC missing,
  // whatever), the visitor should never notice.
  useEffect(() => {
    if (isPreview) return; // owner previewing their own page — don't count it
    if (status === 'found' && !hasTrackedView.current) {
      hasTrackedView.current = true;
      supabase.rpc('increment_profile_view', { p_username: username }).then(
        () => {},
        () => {}
      );
    }
  }, [status, username, isPreview]);

  const handleLinkClick = (linkId) => {
    if (isPreview) return; // owner previewing their own page — don't count it
    // Also fire-and-forget — the <a> tag's default navigation isn't
    // blocked waiting on this.
    supabase.rpc('increment_link_click', { p_link_id: linkId }).then(
      () => {},
      () => {}
    );
  };

  if (status === 'loading') {
    return <ProfileSkeleton />;
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen bg-[#F9F8F3] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white rounded-2xl shadow-sm px-8 py-10 max-w-xs w-full">
          <h1 className="text-2xl font-bold text-[#2D5A27] mb-2">Clink</h1>
          <p className="text-slate-600 mb-4 text-sm">There is no page at /{username}.</p>
          <a
            href="/"
            className="inline-block text-sm text-[#2D5A27] hover:underline font-medium"
          >
            Go to Clink home
          </a>
        </div>
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
  const avatarFallbackText = isDark ? '#F1F5F9' : '#2D5A27';
  const displayName = profile.display_name || '@' + profile.username;

  // Corner circle-button styling. Backgrounds are fully user-customizable,
  // so rather than tying the circle's color to the page theme, it's a
  // frosted glass disc — translucent white + blur + soft shadow. The
  // glass itself is always the same neutral surface no matter what's
  // behind it, so it stays legible everywhere while looking a lot softer
  // than a flat solid-color disc.
  const circleBg = 'rgba(255,255,255,0.55)';
  const circleBorder = 'rgba(255,255,255,0.65)';
  const circleIconColor = '#1A1A1A';

  const pageStyle = isImageBg
    ? {
        backgroundImage: `url(${bgValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : { background: pageBg };

  // Image backgrounds vary too much to guarantee text contrast, so the
  // header sits on a translucent glass panel instead of directly on the
  // photo — keeps it readable no matter what's behind it.
  const headerWrapStyle = isImageBg
    ? {
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }
    : undefined;

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-14 transition-colors relative"
      style={pageStyle}
    >
      {/* Share this profile — top-left corner */}
      <div className="fixed top-4 left-4 z-40">
        <ShareProfileButton username={profile.username} profile={profile} variant="icon" />
      </div>

      {/* Create your own Clink — top-right corner */}
      <a
        href="/?signup=1"
        aria-label="Create your own Clink"
        className="fixed top-4 right-4 z-40 w-14 h-14 flex items-center justify-center rounded-full backdrop-blur-md hover:scale-110 active:scale-95 transition"
        style={{
          background: circleBg,
          border: `1px solid ${circleBorder}`,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke={circleIconColor}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </a>

      <div
        className="w-full max-w-sm transition-all duration-500 ease-out"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(8px)',
        }}
      >
        <div
          className={`flex flex-col items-center text-center mb-8 ${
            isImageBg ? 'rounded-2xl px-5 py-6 shadow-sm' : ''
          }`}
          style={headerWrapStyle}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="w-20 h-20 rounded-full object-cover mb-4"
              style={{ border: `1px solid ${avatarBorder}` }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full mb-4 flex items-center justify-center text-lg font-semibold"
              style={{ background: avatarFallbackBg, color: avatarFallbackText }}
            >
              {getInitials(displayName) || '🔗'}
            </div>
          )}
          <h1 className="text-xl font-bold" style={{ color: nameColor }}>
            {displayName}
          </h1>
          <p className="text-sm" style={{ color: handleColor }}>@{profile.username}</p>
          {profile.show_view_count && (
            <p className="text-xs mt-1" style={{ color: handleColor }}>
              {(profile.view_count ?? 0).toLocaleString()} {profile.view_count === 1 ? 'view' : 'views'}
            </p>
          )}
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
                  onClick={() => handleLinkClick(link.id)}
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

        <p className="text-center text-[11px] mt-8" style={{ color: footerColor }}>
          Made with Clink
        </p>
      </div>
    </div>
  );
}