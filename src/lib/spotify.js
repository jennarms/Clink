const SPOTIFY_TYPES = ['track', 'album', 'playlist', 'episode', 'show'];

// Validates that a URL is a usable open.spotify.com link (used for
// form validation before saving).
export function isValidSpotifyUrl(url) {
  if (!url) return true; // empty is fine, it's optional
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('spotify.com')) return false;
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts.some((p) => SPOTIFY_TYPES.includes(p));
  } catch {
    return false;
  }
}

// Turns a normal Spotify share link (open.spotify.com/track/..., /album/...,
// /playlist/..., /episode/...) into the /embed/ URL Spotify's iframe player
// needs. Returns null for anything unrecognizable so callers can just skip
// rendering the player. `theme` can be '0' (dark, default) or left off for
// Spotify's light theme.
export function getSpotifyEmbedUrl(url, theme = '0') {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('spotify.com')) return null;

    const parts = parsed.pathname.split('/').filter(Boolean); // ["track", "id"] (or ["intl-xx", "track", "id"])
    const typeIndex = parts.findIndex((p) => SPOTIFY_TYPES.includes(p));
    if (typeIndex === -1) return null;

    const type = parts[typeIndex];
    const id = parts[typeIndex + 1];
    if (!id) return null;

    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=${theme}`;
  } catch {
    return null;
  }
}