import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AddLinkForm({ userId, onLinkAdded }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!title || !url || !userId) return;

    const formattedUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;

    const { error } = await supabase
      .from('links')
      .insert([{ user_id: userId, title, url: formattedUrl, description: description || null }]);

    if (error) {
      alert(error.message);
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setOpen(false);
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
          onClick={() => setOpen(false)}
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

      {/* Live preview — mirrors exactly how this will render once added,
          using LinkItem's default solid/forest look, so what you see
          here is what shows up on the public page. */}
      {title && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Preview
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#2D5A27] text-white">
            <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm leading-none bg-white/20">
              🔗
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{title}</div>
              <div className="text-xs truncate mt-0.5 opacity-85">
                {description || url || 'yourlink.com'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-0.5">
        <button
          type="submit"
          className="flex-1 py-2 bg-[#2D5A27] hover:bg-[#23471e] text-white font-medium text-sm rounded-lg transition cursor-pointer"
        >
          Add link
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-2 bg-white border border-slate-300 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}