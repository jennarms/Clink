import { useState } from 'react';
import { useTheme } from '../context/useTheme';
import { PALETTE, QUICK_ICONS, STYLES, cardStyle } from '../lib/linkStyles';
import { supabase } from '../supabaseClient';
import ConfirmDialog from './ConfirmDialog';
import RenderIcon from './RenderIcon';

export default function LinkItem({
  link,
  userId,
  onDeleteLink,
  onUpdateLink,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activePanel, setActivePanel] = useState('none'); // 'none' | 'edit' | 'style'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [accent, setAccent] = useState(link.accent_color || '#2D5A27');
  const [style, setStyle] = useState(link.style || 'solid');
  const [icon, setIcon] = useState(link.icon || 'link');

  const [title, setTitle] = useState(link.title || '');
  const [url, setUrl] = useState(link.url || '');
  const [description, setDescription] = useState(link.description || '');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(link.image_url || null);
  const [imageRemoved, setImageRemoved] = useState(false);

  const togglePanel = (panel) => {
    setActivePanel((prev) => (prev === panel ? 'none' : panel));
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
    setImageRemoved(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    await onDeleteLink(link.id);
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const styleDirty =
    accent !== (link.accent_color || '#2D5A27') ||
    style !== (link.style || 'solid') ||
    icon !== (link.icon || 'link');

  const detailsDirty =
    title !== (link.title || '') ||
    url !== (link.url || '') ||
    description !== (link.description || '') ||
    imageFile !== null ||
    imageRemoved;

  const handleSaveStyle = async () => {
    const { error } = await supabase
      .from('links')
      .update({ accent_color: accent, style: style, icon: icon })
      .eq('id', link.id);

    if (error) {
      alert(error.message);
      return;
    }
    if (onUpdateLink) {
      onUpdateLink(link.id, { accent_color: accent, style: style, icon: icon });
    }
    setActivePanel('none');
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!title || !url) return;

    setUploading(true);

    const formattedUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;

    let image_url = link.image_url || null;

    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${userId}/${link.id}-${Date.now()}.${ext}`;

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
    } else if (imageRemoved) {
      image_url = null;
    }

    const { error } = await supabase
      .from('links')
      .update({ title, url: formattedUrl, description: description || null, image_url })
      .eq('id', link.id);

    setUploading(false);

    if (error) {
      alert(error.message);
      return;
    }
    if (onUpdateLink) {
      onUpdateLink(link.id, { title, url: formattedUrl, description: description || null, image_url });
    }
    setUrl(formattedUrl);
    setImageFile(null);
    setImageRemoved(false);
    setActivePanel('none');
  };

  const handleCancelEdit = () => {
    setTitle(link.title || '');
    setUrl(link.url || '');
    setDescription(link.description || '');
    setImageFile(null);
    setImagePreview(link.image_url || null);
    setImageRemoved(false);
    setActivePanel('none');
  };

  const handleCancelStyle = () => {
    setAccent(link.accent_color || '#2D5A27');
    setStyle(link.style || 'solid');
    setIcon(link.icon || 'link');
    setActivePanel('none');
  };

  const cardBoxStyle = cardStyle(accent, style, isDark);
  const isEditingAnything = activePanel !== 'none';
  const borderColor = isEditingAnything ? accent : isDragOver ? accent : 'transparent';
  const handleColor = style === 'solid' ? 'rgba(255,255,255,0.55)' : `${accent}80`;
  const displaySubtitle = description || url;
  const displayImage = imagePreview;

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-2xl transition-all duration-200 overflow-hidden ${
        isDragging ? 'opacity-40' : ''
      }`}
      style={{
        border: '1.5px solid ' + borderColor,
        boxShadow: isEditingAnything ? `0 2px 12px ${accent}22` : 'none',
      }}
    >
      <div
        className={`flex items-center justify-between p-3.5 group transition-[border-radius] duration-200 ${
          activePanel === 'none' ? 'rounded-2xl' : 'rounded-t-2xl'
        }`}
        style={cardBoxStyle}
      >
        <div className="flex items-center gap-2 truncate mr-2 flex-1 min-w-0">
          <span
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="cursor-grab active:cursor-grabbing shrink-0 select-none text-sm leading-none px-0.5 -ml-1"
            style={{ color: handleColor }}
            title="Drag to reorder"
          >
            ⠿
          </span>
          {isEditingAnything ? (
            <div className="flex items-center gap-3 truncate flex-1 min-w-0">
              <span
                className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-base leading-none overflow-hidden"
                style={{ background: style === 'solid' ? 'rgba(255,255,255,0.2)' : `${accent}1A` }}
              >
                {displayImage ? (
                  <img src={displayImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <RenderIcon iconKey={icon} className="w-5 h-5" />
                )}
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">
                  {title || 'Untitled link'}
                </div>
                <div className="text-xs truncate mt-0.5" style={{ opacity: 0.85 }}>
                  {displaySubtitle || 'yourlink.com'}
                </div>
              </div>
            </div>
          ) : (
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 truncate flex-1 min-w-0">
              {link.image_url ? (
                <img
                  src={link.image_url}
                  alt=""
                  className="w-11 h-11 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span
                  className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-base leading-none"
                  style={{ background: style === 'solid' ? 'rgba(255,255,255,0.2)' : `${accent}1A` }}
                >
                  <RenderIcon iconKey={link.icon} className="w-5 h-5" />
                </span>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate group-hover:underline">
                  {link.title}
                </div>
                {link.description ? (
                  <div className="text-xs truncate mt-0.5" style={{ opacity: 0.85 }}>
                    {link.description}
                  </div>
                ) : (
                  <div className="text-xs truncate mt-0.5" style={{ opacity: 0.75 }}>
                    {link.url}
                  </div>
                )}
              </div>
            </a>
          )}
        </div>

        <div
          className={`flex items-center gap-0.5 shrink-0 transition-opacity duration-150 ${
            isEditingAnything ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={() => togglePanel('edit')}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer text-sm"
            title="Edit link details"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => togglePanel('style')}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer text-sm"
            title="Customize this link"
          >
            🎨
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer text-sm"
            title="Delete link"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Edit panel */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          activePanel === 'edit' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <form onSubmit={handleSaveDetails} className="p-4 bg-[#F9F8F3] dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Title</div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-[#1A1A1A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 dark:focus:ring-[#4CAF50]/30 focus:border-[#2D5A27] dark:focus:border-[#4CAF50]"
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">URL</div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-[#1A1A1A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 dark:focus:ring-[#4CAF50]/30 focus:border-[#2D5A27] dark:focus:border-[#4CAF50]"
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Description</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional short note about this link"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-[#1A1A1A] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 dark:focus:ring-[#4CAF50]/30 focus:border-[#2D5A27] dark:focus:border-[#4CAF50] resize-none"
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Image</div>
              <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
                <span className="text-sm">🖼️</span>
                {imagePreview ? 'Change image' : 'Add Image as Icon (optional)'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/75 text-white text-xs leading-none flex items-center justify-center cursor-pointer transition"
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={!detailsDirty || uploading}
                className="flex-1 py-1.5 bg-[#2D5A27] hover:bg-[#23471e] dark:bg-[#4CAF50] dark:hover:bg-[#3d9142] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition cursor-pointer"
              >
                {uploading ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={uploading}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Style panel */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          activePanel === 'style' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 bg-[#F9F8F3] dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Color</div>
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
                        boxShadow: isActive
                          ? `0 0 0 2px ${isDark ? '#1e293b' : '#fff'}, 0 0 0 3.5px ${c.value}`
                          : 'none',
                      }}
                    >
                      {isActive && (
                        <span className="text-white text-[11px] leading-none drop-shadow-sm">✓</span>
                      )}
                    </button>
                  );
                })}
                <label
                  className="relative w-7 h-7 rounded-full cursor-pointer border-[1.5px] border-dashed border-slate-400 dark:border-slate-500 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:border-slate-500 dark:hover:border-slate-400 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
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
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Style</div>
              <div className="flex gap-2">
                {STYLES.map((st) => {
                  const active = style === st;
                  const previewBoxStyle = cardStyle(accent, st, isDark);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStyle(st)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg cursor-pointer transition-all border ${
                        active
                          ? 'border-[#2D5A27] dark:border-[#4CAF50] bg-white dark:bg-slate-700 shadow-sm'
                          : 'border-transparent hover:bg-white/60 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span
                        className="w-full h-7 rounded-md flex items-center justify-center text-[11px] font-semibold"
                        style={previewBoxStyle}
                      >
                        Aa
                      </span>
                      <span className={`text-[11px] font-medium capitalize ${active ? 'text-[#2D5A27] dark:text-[#4CAF50]' : 'text-slate-500 dark:text-slate-400'}`}>
                        {st}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Icon</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5 -mt-1">
                Used only when this link has no image.
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK_ICONS.map((item) => {
                  const active = icon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.label}
                      onClick={() => setIcon(item.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors border ${
                        active
                          ? 'border-[#2D5A27] dark:border-[#4CAF50] bg-white dark:bg-slate-700 shadow-sm text-[#2D5A27] dark:text-[#4CAF50]'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <RenderIcon iconKey={item.id} className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveStyle}
                disabled={!styleDirty}
                className="flex-1 py-1.5 bg-[#2D5A27] hover:bg-[#23471e] dark:bg-[#4CAF50] dark:hover:bg-[#3d9142] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition cursor-pointer"
              >
                Save style
              </button>
              <button
                type="button"
                onClick={handleCancelStyle}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={`Delete "${link.title}"?`}
        message="This can't be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete link'}
        cancelLabel="Cancel"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}