import { useEffect, useRef } from 'react';
import {
  getAppleMusicEmbedSrc,
  getSoundcloudEmbedSrc,
  getSpotifyEmbedSrc,
  getTwitchEmbedSrc,
  getVimeoEmbedSrc,
  getYoutubeEmbedSrc,
} from '../lib/embeds';

// Some platforms (TikTok, Instagram, X) don't work as plain iframes —
// they need their own JS widget script to hydrate a placeholder
// element into the real embed. This loads a given script once per
// page, regardless of how many embeds of that platform exist, and
// reuses the same in-flight promise if it's requested again before
// the first load finishes.
const scriptPromises = new Map();
function loadScriptOnce(src) {
  if (scriptPromises.has(src)) return scriptPromises.get(src);
  const promise = new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    document.body.appendChild(script);
  });
  scriptPromises.set(src, promise);
  return promise;
}

function TiktokEmbed({ url }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadScriptOnce('https://www.tiktok.com/embed.js').then(() => {
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

function InstagramEmbed({ url }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadScriptOnce('https://www.instagram.com/embed.js').then(() => {
      if (cancelled) return;
      // Instagram's widget doesn't expose a "render just this one"
      // API like TikTok's — process() re-scans the whole page for
      // any unprocessed .instagram-media blockquotes and hydrates
      // them, which is harmless to call again if other IG embeds
      // already exist on the page.
      if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ maxWidth: '100%', minWidth: '260px', margin: 0 }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          View on Instagram
        </a>
      </blockquote>
    </div>
  );
}

function TwitterEmbed({ url }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadScriptOnce('https://platform.twitter.com/widgets.js').then(() => {
      if (cancelled) return;
      if (window.twttr?.widgets?.load && containerRef.current) {
        window.twttr.widgets.load(containerRef.current);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={url} target="_blank" rel="noopener noreferrer">
          View post on X
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
    case 'vimeo':
      content = <IframeEmbed src={getVimeoEmbedSrc(url)} title="Vimeo embed" height={220} />;
      break;
    case 'twitch':
      content = <IframeEmbed src={getTwitchEmbedSrc(url)} title="Twitch embed" height={220} />;
      break;
    case 'tiktok':
      content = <TiktokEmbed url={url} />;
      break;
    case 'instagram':
      content = <InstagramEmbed url={url} />;
      break;
    case 'twitter':
      content = <TwitterEmbed url={url} />;
      break;
    default:
      return null;
  }

  if (!content) return null;

  return <div className={className}>{content}</div>;
}