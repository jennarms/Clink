import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { luminance } from '../lib/linkStyles';

const DEFAULT_BG = '#F9F8F3';

export default function ShareProfileButton({ username, profile }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/${username}`;

  // Mirrors PublicProfile's own background/contrast logic exactly, so the
  // share panel reads like a small piece of the visitor's actual page
  // rather than generic app chrome.
  const bgType = profile?.background_type || 'color';
  const bgValue = profile?.background_value || profile?.theme_color || DEFAULT_BG;
  const isImageBg = bgType === 'image' && !!bgValue;

  const pageBg = isImageBg ? DEFAULT_BG : bgValue;
  const isDark = isImageBg ? false : luminance(pageBg) < 0.5;

  const textColor = isDark ? '#F1F5F9' : '#1A1A1A';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';
  const rowBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const rowBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const panelStyle = isImageBg
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

    // Rasterize the SVG onto a canvas so it can be exported as a PNG —
    // browsers can't directly "download" an inline SVG node as an image.
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const padding = 24;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);
      URL.revokeObjectURL(svgUrl);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `linkie-${username}-qr.png`;
      link.click();
    };
    img.src = svgUrl;
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full h-full flex items-center justify-center gap-1.5 whitespace-nowrap py-2.5 bg-white dark:bg-slate-800 border border-[#2D5A27] dark:border-[#4CAF50] hover:bg-[#2D5A27]/5 dark:hover:bg-[#4CAF50]/10 text-[#2D5A27] dark:text-[#4CAF50] font-medium text-sm rounded-xl transition cursor-pointer shadow-sm mb-4"
      >
        Share Profile
      </button>

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

            <div className="flex flex-col items-center gap-4 px-6 py-6" style={panelStyle}>
              {/* QR itself stays on a plain white card regardless of theme —
                  it needs to stay high-contrast to actually scan reliably. */}
              <div className="p-3 bg-white rounded-xl shadow-sm">
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