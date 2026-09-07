import { useEffect, useRef } from 'react';
import {
    getAppleMusicEmbedSrc,
    getSoundcloudEmbedSrc,
    getSpotifyEmbedSrc,
    getYoutubeEmbedSrc,
} from '../lib/embeds';

// TikTok's oEmbed doesn't work as a plain iframe — it needs their
// embed.js script to hydrate a <blockquote>. This loads that script
// once per page, regardless of how many TikTok embeds exist.
let tiktokScriptPromise = null;
function loadTiktokScript() {
  if (tiktokScriptPromise) return tiktokScriptPromise;
  tiktokScriptPromise = new Promise((resolve) => {
    if (document.querySelector('script[src="https://www.tiktok.com/embed.js"]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    script.onload = resolve;
    document.body.appendChild(script);
  });
  return tiktokScriptPromise;
}

function TiktokEmbed({ url }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadTiktokScript().then(() => {
      if (cancelled) return;
      // If the script already ran once before this element existed,
      // window.tiktokEmbed.lib.render re-scans the page for new
      // blockquotes. Fall back to reloading the script if that API
      // isn't there (older script versions).
      if (window.tiktokEmbed?.lib?.render && containerRef.current) {
        window.tiktokEmbed.lib.render([containerRef.current.querySelector('blockquote')]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <blockquote
        className="tiktok-embed"
        cite={url}
        style={{ maxWidth: '100%', minWidth: '260px' }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          View on TikTok
        </a>
      </blockquote>
    </div>
  );
}

function IframeEmbed({ src, title, height = 152 }) {
  if (!src) return null;
  return (
    <iframe
      title={title}
      src={src}
      width="100%"
      height={height}
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-xl"
    />
  );
}

export default function EmbedPlayer({ url, platform, className = '' }) {
  if (!url || !platform) return null;

  let content;

  switch (platform) {
    case 'spotify':
      content = <IframeEmbed src={getSpotifyEmbedSrc(url)} title="Spotify embed" height={152} />;
      break;
    case 'youtube':
      content = <IframeEmbed src={getYoutubeEmbedSrc(url)} title="YouTube embed" height={200} />;
      break;
    case 'apple_music':
      content = <IframeEmbed src={getAppleMusicEmbedSrc(url)} title="Apple Music embed" height={175} />;
      break;
    case 'soundcloud':
      content = <IframeEmbed src={getSoundcloudEmbedSrc(url)} title="SoundCloud embed" height={166} />;
      break;
    case 'tiktok':
      content = <TiktokEmbed url={url} />;
      break;
    default:
      return null;
  }

  if (!content) return null;

  return <div className={className}>{content}</div>;
}