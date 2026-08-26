export default function AboutWebsite({ onComplete }) {
  return (
    <div className="space-y-4">
      <div className="text-center pt-2 pb-1">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">About Linkie</h2>
        <p className="text-xs text-slate-500 mt-1">Version 1.0.0</p>
      </div>

      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p>Linkie is a simple link-in-bio tool that lets you share all your links from one page.</p>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">

          <div className="px-4 py-3 flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Version</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">1.0.0</span>
          </div>

          <a href="/terms" className="px-4 py-3 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="text-slate-500 dark:text-slate-400">Terms of Service</span>
            <span className="text-[#2D5A27]">View</span>
          </a>

          <a href="/privacy" className="px-4 py-3 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="text-slate-500 dark:text-slate-400">Privacy Policy</span>
            <span className="text-[#2D5A27]">View</span>
          </a>

          <a href="mailto:support@linkie.com" className="px-4 py-3 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="text-slate-500 dark:text-slate-400">Contact Support</span>
            <span className="text-[#2D5A27]">Email</span>
          </a>

        </div>
      </div>

      <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-700">
        <button type="button" onClick={onComplete} className="text-xs text-slate-500 hover:text-[#2D5A27] hover:underline cursor-pointer font-medium">
          Back to Account Settings
        </button>
      </div>
    </div>
  );
}