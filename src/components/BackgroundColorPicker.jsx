import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

const DEFAULT_COLOR = '#F9F8F3';
const BUCKET = 'backgrounds';

// Curated specifically to work AS a full-page background (not as an accent
// color) — soft, low-saturation tones in the light row so dark text stays
// readable, and deep, muted tones in the dark row so light text stays
// readable. Pulled apart from linkStyles.PALETTE on purpose: that palette
// is tuned for small accent surfaces like buttons, not for a canvas that
// sits behind body text for an entire page.
const LIGHT_BACKGROUNDS = [
  { name: 'Cream', value: '#F9F8F3' },
  { name: 'Ivory', value: '#FDF6EC' },
  { name: 'Blush', value: '#FBEAE5' },
  { name: 'Sage Mist', value: '#EAF0E6' },
  { name: 'Sky Mist', value: '#E7F1F5' },
  { name: 'Lavender Mist', value: '#F1EAF5' },
  { name: 'Warm Sand', value: '#F5EFE3' },
];

const DARK_BACKGROUNDS = [
  { name: 'Midnight', value: '#14181F' },
  { name: 'Charcoal', value: '#1F2328' },
  { name: 'Deep Forest', value: '#16241A' },
  { name: 'Deep Navy', value: '#101B2E' },
  { name: 'Espresso', value: '#241A15' },
  { name: 'Plum', value: '#241221' },
  { name: 'Ink', value: '#1A1A1A' },
];

const LIGHT_VALUES = new Set(LIGHT_BACKGROUNDS.map((c) => c.value));

// `onChange` fires on every selection — swatch click, custom color drag,
// or a freshly dropped image — so a parent (like the dashboard preview
// card) can reflect it immediately, before Save is even clicked.
// `onSaved` fires only once the value is actually persisted to Supabase,
// which matters for image mode: the parent needs the real public URL,
// not the temporary blob: URL used for the local preview.
export default function BackgroundColorPicker({ userId, initialType, initialValue, onChange, onSaved }) {
  const [mode, setMode] = useState(initialType === 'image' ? 'image' : 'color');
  const [color, setColor] = useState(initialType === 'image' ? DEFAULT_COLOR : (initialValue || DEFAULT_COLOR));
  const [imageUrl, setImageUrl] = useState(initialType === 'image' ? initialValue : null);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const currentSavedType = initialType === 'image' ? 'image' : 'color';
  const currentSavedValue = initialValue || DEFAULT_COLOR;

  const dirty =
    mode !== currentSavedType ||
    (mode === 'color' && color !== currentSavedValue) ||
    (mode === 'image' && !!pendingFile);

  // Live-preview callback: fires whenever the visible selection changes,
  // regardless of whether it's been saved yet.
  useEffect(() => {
    if (!onChange) return;
    if (mode === 'color') {
      onChange({ type: 'color', value: color });
    } else {
      onChange({ type: 'image', value: previewUrl || imageUrl || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, color, previewUrl, imageUrl]);

  const previewStyle =
    mode === 'color'
      ? { background: color }
      : previewUrl || imageUrl
      ? { backgroundImage: `url(${previewUrl || imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: '#E2E8F0' };

  const applyFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePickFile = (e) => applyFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyFile(e.dataTransfer.files?.[0]);
  };

  const handleSave = async () => {
    setSaving(true);

    if (mode === 'color') {
      const { error } = await supabase
        .from('profiles')
        .update({ background_type: 'color', background_value: color })
        .eq('id', userId);
      setSaving(false);
      if (error) return alert(error.message);
      if (onSaved) onSaved({ type: 'color', value: color });
      return;
    }

    if (!pendingFile) {
      setSaving(false);
      return;
    }

    const ext = pendingFile.name.split('.').pop();
    const path = `${userId}/bg-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, pendingFile, { upsert: true });

    if (uploadError) {
      setSaving(false);
      alert(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ background_type: 'image', background_value: publicUrl })
      .eq('id', userId);

    setSaving(false);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    setImageUrl(publicUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    if (onSaved) onSaved({ type: 'image', value: publicUrl });
  };

  const renderSwatchRow = (swatches) => (
    <div className="flex flex-wrap items-center gap-2.5">
      {swatches.map((c) => {
        const isActive = color === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => setColor(c.value)}
            title={c.name}
            className="relative w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110 flex items-center justify-center shadow-sm border border-black/5"
            style={{
              background: c.value,
              boxShadow: isActive ? `0 0 0 2px #fff, 0 0 0 3.5px ${c.value}` : undefined,
            }}
          >
            {isActive && (
              <span
                className="text-xs leading-none drop-shadow-sm"
                style={{ color: LIGHT_VALUES.has(c.value) ? '#1A1A1A' : '#ffffff' }}
              >
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative mb-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 overflow-hidden">
      {/* Live preview strip */}
      <div
        className="h-16 w-full relative transition-[background] duration-300"
        style={previewStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        <div className="absolute bottom-2 left-3.5 right-3.5 flex items-end justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/90 drop-shadow-sm">
            Preview
          </span>
          {mode === 'image' && !previewUrl && !imageUrl && (
            <span className="text-[10px] text-white/70 drop-shadow-sm">No image yet</span>
          )}
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
              Page background
            </h3>
            <p className="text-[11px] leading-snug text-slate-400 dark:text-slate-500 mt-0.5">
              Fixed for every visitor, independent of their device's dark mode.
            </p>
          </div>

          {/* Sliding segmented control */}
          <div className="relative flex shrink-0 p-0.5 bg-slate-100 dark:bg-slate-900/60 rounded-full">
            <div
              className="absolute top-0.5 bottom-0.5 w-[52px] rounded-full bg-white dark:bg-slate-700 shadow-sm transition-transform duration-200 ease-out"
              style={{ transform: mode === 'image' ? 'translateX(52px)' : 'translateX(0px)' }}
            />
            <button
              type="button"
              onClick={() => setMode('color')}
              className={`relative z-10 w-[52px] py-1 text-[11px] font-medium rounded-full transition-colors cursor-pointer ${
                mode === 'color'
                  ? 'text-slate-800 dark:text-slate-100'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              Color
            </button>
            <button
              type="button"
              onClick={() => setMode('image')}
              className={`relative z-10 w-[52px] py-1 text-[11px] font-medium rounded-full transition-colors cursor-pointer ${
                mode === 'image'
                  ? 'text-slate-800 dark:text-slate-100'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              Image
            </button>
          </div>
        </div>

        {mode === 'color' ? (
          <div className="space-y-3 mb-3.5">
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Light
              </span>
              {renderSwatchRow(LIGHT_BACKGROUNDS)}
            </div>

            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Dark
              </span>
              {renderSwatchRow(DARK_BACKGROUNDS)}
            </div>

            <div className="flex items-center gap-2.5 pt-0.5">
              <label
                className="relative w-8 h-8 rounded-full cursor-pointer border-[1.5px] border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:border-[#2D5A27] hover:text-[#2D5A27] dark:hover:border-[#4CAF50] dark:hover:text-[#4CAF50] transition-colors shrink-0"
                title="Custom color"
              >
                <span className="text-sm leading-none">+</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Custom</span>
              <span className="ml-auto text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                {color}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-3.5">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#2D5A27] bg-[#2D5A27]/5 dark:border-[#4CAF50] dark:bg-[#4CAF50]/10'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="text-slate-400 dark:text-slate-500"
              >
                <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                {imageUrl || previewUrl ? 'Drop to replace image' : 'Drag an image, or click to browse'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                PNG or JPG, up to 5MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePickFile}
                className="hidden"
              />
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="w-full py-1.5 bg-[#2D5A27] hover:bg-[#23471e] dark:bg-[#4CAF50] dark:hover:bg-[#3d9142] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition cursor-pointer"
        >
          {saving ? 'Saving…' : mode === 'color' ? 'Save background color' : 'Save background image'}
        </button>
      </div>
    </div>
  );
}