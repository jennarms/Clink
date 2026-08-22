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

export default function LinkItem({
  link,
  onDeleteLink,
  onUpdateLink,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const [activePanel, setActivePanel] = useState('none'); // 'none' | 'edit' | 'style' | 'delete'
  const [deleting, setDeleting] = useState(false);

  const [accent, setAccent] = useState(link.accent_color || '#2D5A27');
  const [style, setStyle] = useState(link.style || 'solid');
  const [icon, setIcon] = useState(link.icon || '🔗');

  const [title, setTitle] = useState(link.title || '');
  const [url, setUrl] = useState(link.url || '');
  const [description, setDescription] = useState(link.description || '');

  const togglePanel = (panel) => {
    setActivePanel((prev) => (prev === panel ? 'none' : panel));
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    await onDeleteLink(link.id);
    // No need to reset `deleting` on success — this component unmounts
    // once the parent removes the link from its list. If onDeleteLink
    // ever fails silently instead of throwing, this avoids a stuck
    // spinner by resetting here too.
    setDeleting(false);
  };

  const styleDirty =
    accent !== (link.accent_color || '#2D5A27') ||
    style !== (link.style || 'solid') ||
    icon !== (link.icon || '🔗');

  const detailsDirty =
    title !== (link.title || '') ||
    url !== (link.url || '') ||
    description !== (link.description || '');

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

    const formattedUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;

    const { error } = await supabase
      .from('links')
      .update({ title, url: formattedUrl, description: description || null })
      .eq('id', link.id);

    if (error) {
      alert(error.message);
      return;
    }
    if (onUpdateLink) {
      onUpdateLink(link.id, { title, url: formattedUrl, description: description || null });
    }
    setUrl(formattedUrl);
    setActivePanel('none');
  };

  const cardBoxStyle = cardStyle(accent, style);
  const isEditingAnything = activePanel !== 'none';
  const borderColor = isEditingAnything ? accent : isDragOver ? accent : 'transparent';
  // Color for the drag handle glyph — needs to read against whichever
  // background the current style produces (solid/outline/soft).
  const handleColor = style === 'solid' ? 'rgba(255,255,255,0.55)' : `${accent}80`;

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
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 truncate flex-1 min-w-0">
            <span
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm leading-none"
              style={{ background: style === 'solid' ? 'rgba(255,255,255,0.2)' : `${accent}1A` }}
            >
              {link.icon || '🔗'}
            </span>
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
            onClick={() => togglePanel('delete')}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer text-sm"
            title="Delete link"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Edit panel — smooth height transition via grid-rows trick */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          activePanel === 'edit' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <form onSubmit={handleSaveDetails} className="p-4 bg-[#F9F8F3] border-t border-slate-200 space-y-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Title</div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]"
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">URL</div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]"
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Description</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional short note about this link"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={!detailsDirty}
                className="flex-1 py-1.5 bg-[#2D5A27] hover:bg-[#23471e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition cursor-pointer"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle(link.title || '');
                  setUrl(link.url || '');
                  setDescription(link.description || '');
                  setActivePanel('none');
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 font-medium text-xs rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Style panel — smooth height transition via grid-rows trick */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          activePanel === 'style' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 bg-[#F9F8F3] border-t border-slate-200 space-y-4">
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
                  const previewBoxStyle = cardStyle(accent, st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStyle(st)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg cursor-pointer transition-all border ${
                        active
                          ? 'border-[#2D5A27] bg-white shadow-sm'
                          : 'border-transparent hover:bg-white/60'
                      }`}
                    >
                      <span
                        className="w-full h-7 rounded-md flex items-center justify-center text-[11px] font-semibold"
                        style={previewBoxStyle}
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
              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK_ICONS.map((em) => {
                  const active = icon === em;
                  return (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setIcon(em)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm cursor-pointer transition-colors border ${
                        active ? 'border-[#2D5A27] bg-white shadow-sm' : 'border-transparent hover:bg-white/60'
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

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveStyle}
                disabled={!styleDirty}
                className="flex-1 py-1.5 bg-[#2D5A27] hover:bg-[#23471e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition cursor-pointer"
              >
                Save style
              </button>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 font-medium text-xs rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation panel — same transition pattern as edit/style */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          activePanel === 'delete' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 bg-[#F9F8F3] border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 shrink-0 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">
                ✕
              </span>
              <p className="text-sm text-slate-600">
                Delete <span className="font-semibold text-[#1A1A1A]">{link.title}</span>?
                This can't be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                disabled={deleting}
                className="flex-1 py-1.5 bg-white border border-slate-300 text-slate-600 font-medium text-xs rounded-lg hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}