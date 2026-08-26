import { cardStyle, luminance } from '../lib/linkStyles';
import RenderIcon from './RenderIcon';
import SpotifyEmbed from './SpotifyEmbed';

const DEFAULT_BG = '#F9F8F3';

// A static, data-driven "quick look" — not a live iframe of the public
// page. That avoids the three problems an iframe preview runs into here:
// it needs a network round trip (so it flashes empty/loading), it has to
// be non-interactive (pointer-events-none) to avoid stealing scroll from
// the dashboard, and disabling pointer events also disables scrolling
// inside the iframe itself, which is why it looked "stuck" before.
// Rendering from `profile` + `links` (already in memory) sidesteps all of
// that and mirrors PublicProfile's own background/contrast logic exactly.
//
// Sizing is responsive to the viewport the dashboard itself is being
// viewed on: roughly phone-width on small screens, and noticeably larger
// (closer to how the real page reads) from `sm` upward.
export default function PagePreviewCard({ profile, links }) {
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

  const activeLinks = (links || []).filter((l) => l.is_active !== false);
  const shownLinks = activeLinks.slice(0, 4);
  const remaining = activeLinks.length - shownLinks.length;

  const pageStyle = isImageBg
    ? {
        backgroundImage: `url(${bgValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: pageBg };

  return (
    <div className="w-72 sm:w-80 md:w-96 lg:w-[26rem] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden bg-white dark:bg-slate-900 transition-[width] duration-200">
      <div className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 border-b border-slate-100 dark:border-slate-800">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A27] dark:bg-[#4CAF50]" />
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Quick look
        </span>
      </div>

      <div
        className="max-h-80 sm:max-h-[28rem] md:max-h-[34rem] lg:max-h-[38rem] overflow-y-auto px-5 py-6 sm:px-8 sm:py-10 flex flex-col items-center text-center"
        style={pageStyle}
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover mb-3 sm:mb-4"
            style={{ border: `1px solid ${avatarBorder}` }}
          />
        ) : (
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full mb-3 sm:mb-4" style={{ background: avatarFallbackBg }} />
        )}

        <h4 className="text-sm sm:text-xl font-bold leading-tight" style={{ color: nameColor }}>
          {displayName}
        </h4>
        <p className="text-xs sm:text-sm mb-2" style={{ color: handleColor }}>@{profile.username}</p>
        {profile.bio && (
          <p className="text-xs sm:text-sm mb-4 line-clamp-2" style={{ color: bioColor }}>
            {profile.bio}
          </p>
        )}

        {profile.spotify_url && (
          <div className="w-full mb-4">
            <SpotifyEmbed url={profile.spotify_url} label={false} compact />
          </div>
        )}

        {shownLinks.length === 0 ? (
          <p className="text-[11px] sm:text-xs" style={{ color: handleColor }}>No links yet.</p>
        ) : (
          <div className="w-full space-y-2 sm:space-y-3">
            {shownLinks.map((link) => {
              const accent = link.accent_color || '#2D5A27';
              const style = link.style || 'solid';
              const boxStyle = cardStyle(accent, style, isDark);
              const iconBg = style === 'solid' ? 'rgba(255,255,255,0.2)' : accent + '1A';

              return (
                <div
                  key={link.id}
                  className="flex items-center gap-2.5 sm:gap-3 w-full py-2 px-3 sm:py-3 sm:px-4 rounded-lg sm:rounded-xl text-[12px] sm:text-sm font-medium"
                  style={boxStyle}
                >
                  {link.image_url ? (
                    <img
                      src={link.image_url}
                      alt=""
                      className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 rounded-md sm:rounded-lg object-cover"
                    />
                  ) : (
                    <span
                      className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 rounded-md sm:rounded-lg flex items-center justify-center text-xs leading-none"
                      style={{ background: iconBg }}
                    >
                      <RenderIcon iconKey={link.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                  )}
                  <span className="truncate text-left">{link.title}</span>
                </div>
              );
            })}
            {remaining > 0 && (
              <p className="text-[11px] sm:text-xs pt-1" style={{ color: handleColor }}>
                +{remaining} more
              </p>
            )}
          </div>
        )}

        <p className="text-[10px] sm:text-xs mt-5 sm:mt-8" style={{ color: footerColor }}>
          Made with Linkie
        </p>
      </div>

      <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
        <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
          Click Preview to open the full page ↗
        </span>
      </div>
    </div>
  );
}