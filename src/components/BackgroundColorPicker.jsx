import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import SavedConfirmation from './SavedConfirmation';
import useSavedConfirmation from './useSavedConfirmation';

const DEFAULT_COLOR = '#F9F8F3';
const BUCKET = 'backgrounds';

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

// Fresh gradient-specific palette — distinct from the solid background
// colors above so gradient mode doesn't feel like a re-hash. Leans into
// slightly richer, more saturated pairings since a two-tone blend reads
// softer than a flat swatch of the same colors would.
const GRADIENTS = [
  { name: 'Coral Reef', value: 'linear-gradient(135deg, #FF9A8B 0%, #FFC3A0 100%)' },
  { name: 'Citrus', value: 'linear-gradient(135deg, #FDC830 0%, #F37335 100%)' },
  { name: 'Meadow', value: 'linear-gradient(135deg, #A8E063 0%, #56AB2F 100%)' },
  { name: 'Ocean Breeze', value: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)' },
  { name: 'Berry', value: 'linear-gradient(135deg, #C471ED 0%, #F64F59 100%)' },
  { name: 'Twilight', value: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' },
  { name: 'Rose Gold', value: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)' },
  { name: 'Lilac Dusk', value: 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)' },
];

const LIGHT_VALUES = new Set(LIGHT_BACKGROUNDS.map((c) => c.value));
const GRADIENT_VALUES = new Set(GRADIENTS.map((g) => g.value));

// Matches the exact two-stop format this component generates, e.g.
// "linear-gradient(135deg, #F9F8F3 0%, #EAF0E6 100%)". Anything else
// (presets, hand-authored CSS, etc.) is left alone and just won't
// populate the custom builder on load — it'll still render fine via the
// plain `background` style, it just won't be "editable" as custom.
const parseCustomGradient = (value) => {
  if (!value) return null;
  const match = value.match(
    /^linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{3,8})\s*0%,\s*(#[0-9a-fA-F]{3,8})\s*100%\)$/
  );
  if (!match) return null;
  return { angle: parseInt(match[1], 10), stops: [match[2], match[3]] };
};

export default function BackgroundColorPicker({ userId, initialType, initialValue, onChange, onSaved }) {
  const initialMode =
    initialType === 'image' ? 'image' : initialType === 'gradient' ? 'gradient' : 'color';

  const initialParsedCustomGradient =
    initialMode === 'gradient' && !GRADIENT_VALUES.has(initialValue)
      ? parseCustomGradient(initialValue)
      : null;

  const [mode, setMode] = useState(initialMode);
  const [color, setColor] = useState(initialMode === 'color' ? initialValue || DEFAULT_COLOR : DEFAULT_COLOR);
  const [gradient, setGradient] = useState(
    initialMode === 'gradient' ? initialValue : GRADIENTS[0].value
  );
  const [customAngle, setCustomAngle] = useState(initialParsedCustomGradient?.angle ?? 135);
  const [customStops, setCustomStops] = useState(
    initialParsedCustomGradient?.stops ?? ['#FF9A8B', '#667EEA']
  );
  const [imageUrl, setImageUrl] = useState(initialMode === 'image' ? initialValue : null);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const {
    visible: justSaved,
    trigger: showSavedConfirmation,
    dismiss: dismissSavedConfirmation,
  } = useSavedConfirmation();
  const fileInputRef = useRef(null);

  const currentSavedType = initialMode;
  const currentSavedValue = initialValue || DEFAULT_COLOR;

  const dirty =
    mode !== currentSavedType ||
    (mode === 'color' && color !== currentSavedValue) ||
    (mode === 'gradient' && gradient !== currentSavedValue) ||
    (mode === 'image' && !!pendingFile);

  const customGradientValue = `linear-gradient(${customAngle}deg, ${customStops[0]} 0%, ${customStops[1]} 100%)`;
  const isCustomGradientActive = mode === 'gradient' && gradient === customGradientValue;

  useEffect(() => {
    if (!onChange) return;
    if (mode === 'color') {
      onChange({ type: 'color', value: color });
    } else if (mode === 'gradient') {
      onChange({ type: 'gradient', value: gradient });
    } else {
      onChange({ type: 'image', value: previewUrl || imageUrl || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, color, gradient, previewUrl, imageUrl]);

  const previewStyle =
    mode === 'color'
      ? { background: color }
      : mode === 'gradient'
      ? { background: gradient }
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

  const cancelPendingImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCustomStopChange = (index, value) => {
    const nextStops = [...customStops];
    nextStops[index] = value;
    setCustomStops(nextStops);
    setGradient(`linear-gradient(${customAngle}deg, ${nextStops[0]} 0%, ${nextStops[1]} 100%)`);
  };

  const handleCustomAngleChange = (value) => {
    setCustomAngle(value);
    setGradient(`linear-gradient(${value}deg, ${customStops[0]} 0%, ${customStops[1]} 100%)`);
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
      showSavedConfirmation();
      return;
    }

    if (mode === 'gradient') {
      const { error } = await supabase
        .from('profiles')
        .update({ background_type: 'gradient', background_value: gradient })
        .eq('id', userId);
      setSaving(false);
      if (error) return alert(error.message);
      if (onSaved) onSaved({ type: 'gradient', value: gradient });
      showSavedConfirmation();
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
    showSavedConfirmation();
  };

  const renderSwatchRow = (swatches, currentValue, onSelect, lightSet) => (
    <div className="flex flex-wrap items-center gap-2.5">
      {swatches.map((c) => {
        const isActive = currentValue === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onSelect(c.value)}
            title={c.name}
            aria-label={c.name}
            aria-pressed={isActive}
            className="relative w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110 flex items-center justify-center shadow-sm border border-black/5"
            style={{
              background: c.value,
              boxShadow: isActive ? `0 0 0 2px #fff, 0 0 0 3.5px ${lightSet.has(c.value) ? '#00000033' : c.value}` : undefined,
            }}
          >
            {isActive && (
              <span
                className="text-xs leading-none drop-shadow-sm"
                style={{ color: lightSet.has(c.value) ? '#1A1A1A' : '#ffffff' }}
              >
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const modeIndex = mode === 'color' ? 0 : mode === 'gradient' ? 1 : 2;
  const modes = [
    { key: 'color', label: 'Color' },
    { key: 'gradient', label: 'Gradient' },
    { key: 'image', label: 'Image' },
  ];

  return (
    <div className="relative mb-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 overflow-hidden">
      {/* Live preview strip */}
      <div className="h-16 w-full relative transition-[background] duration-300" style={previewStyle}>
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
          <div className="relative flex shrink-0 w-[186px] p-0.5 bg-slate-100 dark:bg-slate-900/60 rounded-full">
            <div
              className="absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-white dark:bg-slate-700 shadow-sm transition-transform duration-200 ease-out"
              style={{ width: 'calc(33.333% - 2.5px)', transform: `translateX(${modeIndex * 100}%)` }}
            />
            {modes.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                aria-pressed={mode === m.key}
                className={`relative z-10 flex-1 py-1 text-[11px] font-medium rounded-full transition-colors cursor-pointer ${
                  mode === m.key
                    ? 'text-slate-800 dark:text-slate-100'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {mode === 'color' && (
          <div className="space-y-3 mb-3.5">
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Light
              </span>
              {renderSwatchRow(LIGHT_BACKGROUNDS, color, setColor, LIGHT_VALUES)}
            </div>

            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Dark
              </span>
              {renderSwatchRow(DARK_BACKGROUNDS, color, setColor, LIGHT_VALUES)}
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
        )}

        {mode === 'gradient' && (
          <div className="space-y-3 mb-3.5">
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Presets
              </span>
              {renderSwatchRow(GRADIENTS, gradient, setGradient, new Set())}
            </div>

            {/* Custom two-stop gradient builder */}
            <div
              className={`p-2.5 rounded-xl border transition-colors ${
                isCustomGradientActive
                  ? 'border-[#2D5A27] dark:border-[#4CAF50] bg-[#2D5A27]/[0.04] dark:bg-[#4CAF50]/[0.08]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Custom
                </span>
                {isCustomGradientActive && (
                  <span className="text-[10px] font-medium text-[#2D5A27] dark:text-[#4CAF50]">Selected</span>
                )}
              </div>

              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex items-center gap-1.5 shrink-0">
                  <label
                    className="relative w-7 h-7 rounded-full overflow-hidden border border-black/10 cursor-pointer"
                    style={{ background: customStops[0] }}
                    title="Start color"
                  >
                    <input
                      type="color"
                      value={customStops[0]}
                      onChange={(e) => handleCustomStopChange(0, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600 shrink-0">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <label
                    className="relative w-7 h-7 rounded-full overflow-hidden border border-black/10 cursor-pointer"
                    style={{ background: customStops[1] }}
                    title="End color"
                  >
                    <input
                      type="color"
                      value={customStops[1]}
                      onChange={(e) => handleCustomStopChange(1, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={customAngle}
                    onChange={(e) => handleCustomAngleChange(Number(e.target.value))}
                    className="flex-1 h-1.5 accent-[#2D5A27] dark:accent-[#4CAF50] cursor-pointer"
                    aria-label="Gradient angle"
                  />
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 w-8 text-right shrink-0">
                    {customAngle}°
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setGradient(customGradientValue)}
                className="w-full h-8 rounded-lg cursor-pointer transition-transform hover:scale-[1.01] border border-black/5"
                style={{ background: customGradientValue }}
                title="Use this gradient"
                aria-label="Use custom gradient"
              />
            </div>
          </div>
        )}

        {mode === 'image' && (
          <div className="mb-3.5">
            <div className="relative">
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

              {previewUrl && (
                <button
                  type="button"
                  onClick={cancelPendingImage}
                  title="Cancel selection"
                  aria-label="Cancel selected image"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs leading-none flex items-center justify-center cursor-pointer transition-colors"
                >
                  ×
                </button>
              )}
            </div>

            {pendingFile && (
              <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {pendingFile.name}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="w-full py-1.5 bg-[#2D5A27] hover:bg-[#23471e] dark:bg-[#4CAF50] dark:hover:bg-[#3d9142] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition cursor-pointer"
        >
          {saving
            ? 'Saving…'
            : mode === 'color'
            ? 'Save background color'
            : mode === 'gradient'
            ? 'Save background gradient'
            : 'Save background image'}
        </button>

        <SavedConfirmation
          show={justSaved}
          onDismiss={dismissSavedConfirmation}
          message={
            <>
              Background saved. Hover or click <strong className="font-semibold">Preview</strong> to see it live.
            </>
          }
        />
      </div>
    </div>
  );
}