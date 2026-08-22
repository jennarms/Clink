import { useState } from 'react';
import { supabase } from '../supabaseClient';

const PALETTE = [
  { name: 'Forest', value: '#2D5A27' },
  { name: 'Ocean',  value: '#1E5F74' },
  { name: 'Sunset', value: '#C1502E' },
  { name: 'Berry',  value: '#7B2D5E' },
  { name: 'Slate',  value: '#3D4451' },
  { name: 'Gold',   value: '#A67C27' },
  { name: 'Rose',   value: '#B33951' },
  { name: 'Ink',    value: '#1A1A1A' },
];

const STYLES = ['solid', 'outline', 'soft'];
const QUICK_ICONS = ['🔗', '🎵', '📸', '▶️', '🛍️', '🌐', '💬', '✨', '📝', '🎮'];

function cardStyle(accent, style) {
  if (style === 'outline') {
    return { background: '#fff', border: '1.5px solid ' + accent, color: accent };
  }
  if (style === 'soft') {
    return { background: accent + '14', border: '1px solid ' + accent + '33', color: accent };
  }
  return { background: accent, border: '1px solid ' + accent, color: '#fff' };
}

export default function AddLinkForm({ userId, onLinkAdded }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Design — same defaults LinkItem falls back to, so a link created
  // here looks identical to one that's never been styled.
  const [showDesign, setShowDesign] = useState(false);
  const [accent, setAccent] = useState('#2D5A27');
  const [style, setStyle] = useState('solid');
  const [icon, setIcon] = useState('🔗');

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    setShowDesign(false);
    setAccent('#2D5A27');
    setStyle('solid');
    setIcon('🔗');
    setOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!title || !url || !userId) return;

    setUploading(true);

    const formattedUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;

    let image_url = null;

    // Upload the image first (if one was picked), so we have the
    // public URL ready before we insert the link row.
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('link-images')
        .upload(path, imageFile);

      if (uploadError) {
        alert(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('link-images')
        .getPublicUrl(path);

      image_url = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from('links')
      .insert([{
        user_id: userId,
        title,
        url: formattedUrl,
        description: description || null,
        image_url,
        accent_color: accent,
        style,
        icon,
      }]);

    setUploading(false);

    if (error) {
      alert(error.message);
    } else {
      resetForm();
      onLinkAdded();
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 p-3.5 mb-2 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-medium hover:border-[#2D5A27] hover:text-[#2D5A27] hover:bg-[#2D5A27]/[0.03] transition-colors cursor-pointer"
      >
        <span className="w-5 h-5 rounded-full border-[1.5px] border-current flex items-center justify-center text-xs leading-none">
          +
        </span>
        Add link
      </button>
    );
  }

  const previewBoxStyle = cardStyle(accent, style);

  return (
    <form
      onSubmit={handleAddLink}
      className="p-4 mb-2 rounded-2xl border border-[#2D5A27]/30 bg-[#F9F8F3] shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          New link
        </span>
        <button
          type="button"
          onClick={resetForm}
          className="text-slate-400 hover:text-slate-600 text-sm leading-none cursor-pointer"
          title="Cancel"
        >
          ✕
        </button>
      </div>

      <input
        type="text"
        placeholder="Title (e.g. My Portfolio)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        required
        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]"
      />
      <input
        type="text"
        placeholder="URL (e.g. instagram.com/user)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] resize-none"
      />

      {/* Image picker */}
      <div>
        <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition">
          <span className="text-sm">🖼️</span>
          {imageFile ? 'Change image' : 'Add image (optional)'}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        {imagePreview && (
          <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-300">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-40 object-cover"
            />
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/75 text-white text-xs leading-none flex items-center justify-center cursor-pointer transition"
              title="Remove image"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Design toggle — same picker LinkItem uses, opened up front
          instead of having to edit the link after creating it. */}
      <div>
        <button
          type="button"
          onClick={() => setShowDesign((prev) => !prev)}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition"
        >
          <span className="text-sm">🎨</span>
          {showDesign ? 'Hide design options' : 'Customize design (optional)'}
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            showDesign ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-2 p-3.5 rounded-xl border border-slate-200 bg-white space-y-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Color</div>
                <div className="flex flex-wrap items-center gap-2">
                  {PALETTE.map((c) => {
                    const isActive = accent === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setAccent(c.value)}
                        title={c.name}
                        className="relative w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                        style={{
                          background: c.value,
                          boxShadow: isActive ? `0 0 0 2px #fff, 0 0 0 3.5px ${c.value}` : 'none',
                        }}
                      >
                        {isActive && (
                          <span className="text-white text-[11px] leading-none drop-shadow-sm">✓</span>
                        )}
                      </button>
                    );
                  })}
                  <label
                    className="relative w-7 h-7 rounded-full cursor-pointer border-[1.5px] border-dashed border-slate-400 flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-500 transition-colors"
                    title="Custom color"
                  >
                    <span className="text-xs leading-none">+</span>
                    <input
                      type="color"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Style</div>
                <div className="flex gap-2">
                  {STYLES.map((st) => {
                    const active = style === st;
                    const stBoxStyle = cardStyle(accent, st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStyle(st)}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg cursor-pointer transition-all border ${
                          active
                            ? 'border-[#2D5A27] bg-white shadow-sm'
                            : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="w-full h-7 rounded-md flex items-center justify-center text-[11px] font-semibold"
                          style={stBoxStyle}
                        >
                          Aa
                        </span>
                        <span className={`text-[11px] font-medium capitalize ${active ? 'text-[#2D5A27]' : 'text-slate-500'}`}>
                          {st}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Icon</div>
                <div className="text-[11px] text-slate-400 mb-1.5 -mt-1">
                  Used only if you don't add an image above.
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {QUICK_ICONS.map((em) => {
                    const active = icon === em;
                    return (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setIcon(em)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm cursor-pointer transition-colors border ${
                          active ? 'border-[#2D5A27] bg-white shadow-sm' : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        {em}
                      </button>
                    );
                  })}
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value.slice(0, 2))}
                    placeholder="Custom"
                    className="w-16 h-8 px-2 bg-white border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live preview — mirrors exactly how this will render once added,
          using whichever color/style/icon (or image) is currently chosen */}
      {title && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Preview
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={previewBoxStyle}>
            <span
              className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-base leading-none overflow-hidden"
              style={{ background: style === 'solid' ? 'rgba(255,255,255,0.2)' : `${accent}1A` }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              ) : (
                icon
              )}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{title}</div>
              <div className="text-xs truncate mt-0.5" style={{ opacity: 0.85 }}>
                {description || url || 'yourlink.com'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-0.5">
        <button
          type="submit"
          disabled={uploading}
          className="flex-1 py-2 bg-[#2D5A27] hover:bg-[#23471e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition cursor-pointer"
        >
          {uploading ? 'Adding…' : 'Add link'}
        </button>
        <button
          type="button"
          onClick={resetForm}
          disabled={uploading}
          className="px-3 py-2 bg-white border border-slate-300 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}