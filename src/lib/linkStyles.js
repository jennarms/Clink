export const PALETTE = [
  { name: 'Forest', value: '#2D5A27' },
  { name: 'Ocean',  value: '#1E5F74' },
  { name: 'Sunset', value: '#C1502E' },
  { name: 'Berry',  value: '#7B2D5E' },
  { name: 'Slate',  value: '#3D4451' },
  { name: 'Gold',   value: '#A67C27' },
  { name: 'Rose',   value: '#B33951' },
  { name: 'Ink',    value: '#1A1A1A' },
];

export const STYLES = ['solid', 'outline', 'soft'];

export const QUICK_ICONS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'x', label: 'X / Twitter' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'discord', label: 'Discord' },
  { id: 'link', label: 'Link' },
  { id: 'globe', label: 'Website' },
  { id: 'shop', label: 'Shop' },
  { id: 'sparkles', label: 'Featured' },
  { id: 'notes', label: 'Notes' },
];

// --- contrast helpers ---

export function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function lighten(hex, amount = 0.55) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function darken(hex, amount = 0.55) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c) => Math.round(c * (1 - amount));
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Picks black or white, whichever contrasts better against `hex`.
// Used for `solid` cards where the background IS the accent color.
function contrastOn(hex) {
  return luminance(hex) > 0.6 ? '#1A1A1A' : '#ffffff';
}

// For `soft`/`outline`, the accent is used as TEXT on a near-page-colored
// background, not as the background itself. So it needs the opposite fix:
// - in dark mode, an accent that's too dark won't show on the dark page → lighten it
// - in light mode, an accent that's too light won't show on the white page → darken it
function readableAccentText(accent, isDark) {
  const lum = luminance(accent);
  if (isDark) return lum < 0.4 ? lighten(accent) : accent;
  return lum > 0.7 ? darken(accent) : accent;
}

// Theme-aware. `outline` swaps its card background instead of staying
// hardcoded white. `soft` and `solid` both adjust their text/background
// so extreme accent colors (pure black, pure white, etc.) never end up
// blending into the card or the page in either theme.
export function cardStyle(accent, style, isDark) {
  if (style === 'outline') {
    return {
      background: isDark ? '#1e293b' : '#fff',
      border: '1.5px solid ' + accent,
      color: readableAccentText(accent, isDark),
    };
  }
  if (style === 'soft') {
    return {
      background: accent + (isDark ? '26' : '14'),
      border: '1px solid ' + accent + (isDark ? '4D' : '33'),
      color: readableAccentText(accent, isDark),
    };
  }
  // solid: background IS the accent, so pick text by contrast against it,
  // not a hardcoded white — and always keep a hairline border so a very
  // dark accent doesn't visually vanish into a dark-mode page.
  return {
    background: accent,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.12)' : accent),
    color: contrastOn(accent),
  };
}