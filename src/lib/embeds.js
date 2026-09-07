// Central place for "what platform is this link, and how do I turn it
// into something embeddable" logic. Adding a new platform later means
// touching this file and EmbedPlayer.jsx — nowhere else.

const PLATFORM_MATCHERS = [
  { platform: 'spotify', test: (url) => /open\.spotify\.com/.test(url) },
  { platform: 'youtube', test: (url) => /(youtube\.com|youtu\.be)/.test(url) },
  { platform: 'apple_music', test: (url) => /music\.apple\.com/.test(url) },
  { platform: 'soundcloud', test: (url) => /soundcloud\.com/.test(url) },
  { platform: 'tiktok', test: (url) => /tiktok\.com/.test(url) },
  { platform: 'instagram', test: (url) => /instagram\.com\/(p|reel|tv)\//.test(url) },
  { platform: 'vimeo', test: (url) => /vimeo\.com\/\d+/.test(url) },
  { platform: 'twitch', test: (url) => /(twitch\.tv|clips\.twitch\.tv)/.test(url) },
  { platform: 'twitter', test: (url) => /(twitter\.com|x\.com)\/[^/]+\/status\//.test(url) },
];

export function detectEmbedPlatform(url) {
  if (!url) return null;
  const trimmed = url.trim();
  const match = PLATFORM_MATCHERS.find((m) => m.test(trimmed));
  return match ? match.platform : null;
}

export function isValidEmbedUrl(url) {
  if (!url) return true; // empty is allowed — it's an optional field
  try {
    const parsed = new URL(url.trim());
    if (!/^https?:$/.test(parsed.protocol)) return false;
  } catch {
    return false;
  }
  return detectEmbedPlatform(url) !== null;
}

// Turns a normal share-link into the URL that actually goes in an
// <iframe src>. Each platform has its own embed-path convention.
export function getSpotifyEmbedSrc(url) {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  const [, type, id] = match;
  return `https://open.spotify.com/embed/${type}/${id}`;
}

export function getYoutubeEmbedSrc(url) {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  const id = watchMatch?.[1] || shortMatch?.[1] || shortsMatch?.[1] || null;
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

export function getAppleMusicEmbedSrc(url) {
  if (!/music\.apple\.com/.test(url)) return null;
  return url.replace('music.apple.com', 'embed.music.apple.com');
}

export function getSoundcloudEmbedSrc(url) {
  // SoundCloud's player takes the original track URL as a query param,
  // no ID extraction needed on our end.
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%232D5A27&auto_play=false&show_teaser=false`;
}

export function getVimeoEmbedSrc(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (!match) return null;
  return `https://player.vimeo.com/video/${match[1]}`;
}

// Twitch's player requires a `parent` param naming the domain that's
// embedding it — it refuses to render otherwise. We read the current
// hostname at render time rather than hardcoding it, so this keeps
// working across localhost, staging, and production without edits.
export function getTwitchEmbedSrc(url) {
  const parent = window.location.hostname;

  const clipMatch =
    url.match(/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/) ||
    url.match(/twitch\.tv\/[^/]+\/clip\/([a-zA-Z0-9_-]+)/);
  if (clipMatch) {
    return `https://clips.twitch.tv/embed?clip=${clipMatch[1]}&parent=${parent}`;
  }

  const videoMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (videoMatch) {
    return `https://player.twitch.tv/?video=${videoMatch[1]}&parent=${parent}`;
  }

  const channelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)\/?$/);
  if (channelMatch) {
    return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${parent}`;
  }

  return null;
}