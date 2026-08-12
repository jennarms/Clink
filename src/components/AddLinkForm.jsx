import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AddLinkForm({ userId, onLinkAdded }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!title || !url || !userId) return;

    const formattedUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;

    const { error } = await supabase
      .from('links')
      .insert([
        {
          user_id: userId,
          title,
          url: formattedUrl,
        },
      ]);

    if (error) {
      alert(error.message);
    } else {
      setTitle('');
      setUrl('');
      onLinkAdded();
    }
  };

  return (
    <form onSubmit={handleAddLink} className="space-y-3 mb-6">
      <h3 className="font-semibold text-slate-700 text-sm">Add New Link</h3>
      <input
        type="text"
        placeholder="Title (e.g. My Portfolio)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
      />
      <input
        type="text"
        placeholder="URL (e.g. instagram.com/user)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] shadow-sm"
      />
      <button
        type="submit"
        className="w-full py-2.5 bg-[#2D5A27] hover:bg-[#23471e] text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-sm"
      >
        + Add Link
      </button>
    </form>
  );
}