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
      alert(url);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full py-2.5 bg-white dark:bg-slate-800 border border-[#2D5A27] dark:border-[#4CAF50] hover:bg-[#2D5A27]/5 dark:hover:bg-[#4CAF50]/10 text-[#2D5A27] dark:text-[#4CAF50] font-medium text-sm rounded-xl transition cursor-pointer shadow-sm mb-4"
    >
      {copied ? '✓ Copied to clipboard!' : 'Share Profile'}
    </button>
  );
}