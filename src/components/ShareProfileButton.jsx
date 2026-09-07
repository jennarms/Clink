import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { luminance } from '../lib/linkStyles';

const DEFAULT_BG = '#F9F8F3';

export default function ShareProfileButton({ username, profile, variant = 'pill' }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/${username}`;
  const displayName = profile?.display_name || `@${username}`;

  // Mirrors PublicProfile's own background/contrast logic exactly, so the
  // share card reads like a small piece of the visitor's actual page
  // rather than generic app chrome. This same styling drives both the
  // on-screen preview below AND the downloaded PNG, so what you see here
  // is exactly what you get.
  const bgType = profile?.background_type || 'color';
  const bgValue = profile?.background_value || profile?.theme_color || DEFAULT_BG;
  const isImageBg = bgType === 'image' && !!bgValue;

  const pageBg = isImageBg ? DEFAULT_BG : bgValue;
  const isDark = isImageBg ? false : luminance(pageBg) < 0.5;

  const textColor = isDark ? '#F1F5F9' : '#1A1A1A';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';
  const rowBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const rowBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  // Icon-button (corner circle) styling. Backgrounds are fully
  // user-customizable, so rather than tying the circle's color to the
  // page theme, it's a frosted glass disc — translucent white + blur +
  // soft shadow. The glass itself is always the same neutral surface no
  // matter what's behind it, so it stays legible everywhere while
  // looking a lot softer than a flat solid-color disc.
  const circleBg = 'rgba(255,255,255,0.55)';
  const circleBorder = 'rgba(255,255,255,0.65)';
  const circleIconColor = '#1A1A1A';

  const cardBgStyle = isImageBg
    ? {
        backgroundImage: `url(${bgValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: pageBg };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(url);
    }
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('share-qr-code');
    if (!svg) return;

    const SCALE = 2; // render at 2x for crisp downloads
    const CARD_W = 360;
    const PAD = 32;
    const AVATAR_SIZE = 56;
    const NAME_GAP = 14;
    const QR_SIZE = 176;
    const QR_CARD_PAD = 14;
    const QR_CARD_SIZE = QR_SIZE + QR_CARD_PAD * 2;
    const GAP = 18;
    const PILL_H = 42;
    const FOOTER_H = 24;

    const hasAvatar = !!profile?.avatar_url;
    const headerH = hasAvatar ? AVATAR_SIZE + NAME_GAP + 24 + 20 : 24 + 20;

    const CARD_H =
      PAD + headerH + QR_CARD_SIZE + GAP + PILL_H + GAP + FOOTER_H + PAD;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const drawRoundedRect = (ctx, x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const drawCircleClip = (img, x, y, size) => {
      // returns a small offscreen canvas with the avatar pre-clipped to a circle
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const cctx = c.getContext('2d');
      cctx.beginPath();
      cctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      cctx.closePath();
      cctx.clip();
      cctx.drawImage(img, 0, 0, size, size);
      return c;
    };

    const drawRestOfCard = (ctx, canvas, qrImg, avatarImg) => {
      let y = PAD;

      if (avatarImg) {
        const ax = (CARD_W - AVATAR_SIZE) / 2;
        const clipped = drawCircleClip(avatarImg, ax, y, AVATAR_SIZE);
        ctx.drawImage(clipped, ax, y, AVATAR_SIZE, AVATAR_SIZE);
        y += AVATAR_SIZE + NAME_GAP;
      } else {
        y += 8;
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = textColor;
      ctx.font = '700 20px system-ui, -apple-system, sans-serif';
      ctx.fillText(displayName, CARD_W / 2, y + 18);
      y += 24;

      ctx.fillStyle = mutedColor;
      ctx.font = '500 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`@${username}`, CARD_W / 2, y + 14);
      y += 20 + 20;

      // QR white card, matches the modal's "p-3 bg-white rounded-xl shadow-sm"
      const qrCardX = (CARD_W - QR_CARD_SIZE) / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, qrCardX, y, QR_CARD_SIZE, QR_CARD_SIZE, 16);
      ctx.fill();
      ctx.restore();
      ctx.drawImage(qrImg, qrCardX + QR_CARD_PAD, y + QR_CARD_PAD, QR_SIZE, QR_SIZE);
      y += QR_CARD_SIZE + GAP;

      // URL pill, matches the modal's rowBg/rowBorder row
      drawRoundedRect(ctx, PAD, y, CARD_W - PAD * 2, PILL_H, 12);
      ctx.fillStyle = rowBg;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = rowBorder;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '500 13px system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      let displayUrl = url;
      const maxTextWidth = CARD_W - PAD * 2 - 24;
      while (ctx.measureText(displayUrl).width > maxTextWidth && displayUrl.length > 4) {
        displayUrl = displayUrl.slice(0, -4) + '…';
      }
      ctx.fillText(displayUrl, CARD_W / 2, y + PILL_H / 2);
      y += PILL_H + GAP;

      ctx.fillStyle = mutedColor;
      ctx.font = '500 12px system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Made with Clink', CARD_W / 2, y + FOOTER_H / 2 + 4);

      URL.revokeObjectURL(svgUrl);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `Clink-${username}-qr.png`;
      link.click();
    };

    const finishWithBackground = (ctx, canvas, qrImg) => {
      if (hasAvatar) {
        const avatarImg = new Image();
        avatarImg.crossOrigin = 'anonymous';
        avatarImg.onload = () => drawRestOfCard(ctx, canvas, qrImg, avatarImg);
        avatarImg.onerror = () => drawRestOfCard(ctx, canvas, qrImg, null);
        avatarImg.src = profile.avatar_url;
      } else {
        drawRestOfCard(ctx, canvas, qrImg, null);
      }
    };

    const qrImg = new Image();
    qrImg.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CARD_W * SCALE;
      canvas.height = CARD_H * SCALE;
      const ctx = canvas.getContext('2d');
      ctx.scale(SCALE, SCALE);

      if (isImageBg) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => {
          const scale = Math.max(CARD_W / bgImg.width, CARD_H / bgImg.height);
          const w = bgImg.width * scale;
          const h = bgImg.height * scale;
          ctx.drawImage(bgImg, (CARD_W - w) / 2, (CARD_H - h) / 2, w, h);
          finishWithBackground(ctx, canvas, qrImg);
        };
        bgImg.onerror = () => {
          ctx.fillStyle = DEFAULT_BG;
          ctx.fillRect(0, 0, CARD_W, CARD_H);
          finishWithBackground(ctx, canvas, qrImg);
        };
        bgImg.src = bgValue;
      } else {
        ctx.fillStyle = pageBg;
        ctx.fillRect(0, 0, CARD_W, CARD_H);
        finishWithBackground(ctx, canvas, qrImg);
      }
    };
    qrImg.src = svgUrl;
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={() => setShowModal(true)}
          aria-label="Share profile"
          className="w-14 h-14 flex items-center justify-center rounded-full backdrop-blur-md hover:scale-110 active:scale-95 transition cursor-pointer"
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
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="w-full h-full flex items-center justify-center gap-1.5 whitespace-nowrap py-2.5 bg-white dark:bg-slate-800 border border-[#2D5A27] dark:border-[#4CAF50] hover:bg-[#2D5A27]/5 dark:hover:bg-[#4CAF50]/10 text-[#2D5A27] dark:text-[#4CAF50] font-medium text-sm rounded-xl transition cursor-pointer shadow-sm mb-4"
        >
          Share Profile
        </button>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Share your page
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* This panel IS the card preview — its exact look (background,
                avatar, name, QR plate, url pill) is what gets rasterized
                into the downloaded PNG in handleDownloadQr. */}
            <div className="flex flex-col items-center gap-3 px-6 py-6" style={cardBgStyle}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : null}

              <div className="text-center">
                <div className="text-base font-bold" style={{ color: textColor }}>
                  {displayName}
                </div>
                <div className="text-xs mt-0.5" style={{ color: mutedColor }}>
                  @{username}
                </div>
              </div>

              {/* QR itself stays on a plain white card regardless of theme —
                  it needs to stay high-contrast to actually scan reliably. */}
              <div className="p-3 bg-white rounded-xl shadow-sm mt-1">
                <QRCodeSVG id="share-qr-code" value={url} size={176} />
              </div>

              <div
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ background: rowBg, borderColor: rowBorder }}
              >
                <span className="flex-1 text-xs truncate" style={{ color: textColor }}>
                  {url}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 text-xs font-semibold hover:underline cursor-pointer"
                  style={{ color: textColor }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="w-full py-1 text-xs font-medium hover:underline cursor-pointer transition-colors"
                style={{ color: mutedColor }}
              >
                Download QR code
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}