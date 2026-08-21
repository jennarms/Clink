import { useState } from 'react';

export default function ShareProfileButton({ username }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(url); // fallback if clipboard API is blocked
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full py-2.5 bg-white border border-[#2D5A27] hover:bg-[#2D5A27]/5 text-[#2D5A27] font-medium text-sm rounded-xl transition cursor-pointer shadow-sm mb-4"
    >
      {copied ? '✓ Copied to clipboard!' : '🔗 Share Profile'}
    </button>
  );
}