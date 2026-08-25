import { useEffect, useState } from 'react';
import { getSpotifyEmbedUrl } from '../lib/spotify';

// Fetches title/artist/cover art from Spotify's public oEmbed endpoint so
// we can build a richer card around the iframe instead of a flat frame.
// Stores the fetched data tagged with the url it belongs to, and derives
// the returned value during render (result matches current url ? data :
// null) — this way there's never a need to synchronously reset state
// inside the effect body when the url changes or clears. The only
// setState call happens inside the resolved-fetch callback, which is
// the pattern React expects for effects that sync with an external system.
function useSpotifyMeta(url) {
  const [result, setResult] = useState(null); // { url, data } | null

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setResult({ url, data });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [url]);

  return result?.url === url ? result.data : null;
}

export default function SpotifyEmbed({ url, label = true, className = '' }) {
  const embedUrl = getSpotifyEmbedUrl(url);
  const meta = useSpotifyMeta(url);

  if (!embedUrl) return null;

  const cover = meta?.thumbnail_url;

  return (
    <div className={className}>
      {label && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 px-0.5">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#1DB954]" aria-hidden="true">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38C8.64 5.939 15.6 6.24 19.68 8.641c.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          On my Spotify
        </p>
      )}

      <div className="relative rounded-2xl">
        <div className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
          {/* Blurred album-art backdrop, falls back to plain dark surface
              if the cover art hasn't loaded (or oEmbed request failed). */}
          <div className="absolute inset-0">
            {cover ? (
              <img
                src={cover}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover scale-125 blur-2xl saturate-150 opacity-60"
              />
            ) : (
              <div className="w-full h-full bg-[#121212]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/70" />
          </div>

          {/* Now-playing header strip with a tiny animated equalizer */}
          <div className="relative flex items-center gap-2 px-3.5 pt-3 pb-2">
            <span className="flex items-end gap-[2px] h-3">
              <span className="w-[3px] bg-[#1DB954] rounded-full" style={{ animation: 'eq-bar 0.9s ease-in-out infinite', animationDelay: '0s' }} />
              <span className="w-[3px] bg-[#1DB954] rounded-full" style={{ animation: 'eq-bar 0.9s ease-in-out infinite', animationDelay: '0.2s' }} />
              <span className="w-[3px] bg-[#1DB954] rounded-full" style={{ animation: 'eq-bar 0.9s ease-in-out infinite', animationDelay: '0.4s' }} />
            </span>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-white/80 truncate">
              My fav song rn
            </p>
          </div>

          <div className="relative px-2 pb-2">
            <iframe
              key={embedUrl}
              src={embedUrl}
              width="100%"
              height={152}
              style={{ display: 'block', border: 0, borderRadius: 12 }}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify player"
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes eq-bar {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}</style>
    </div>
  );
}