// Floating confirmation toast — a small card that slides up from the
// bottom-right corner, sits above the page content, and disappears on
// its own once the timer in `useSavedConfirmation` runs out. Pair the
// two together anywhere you need a "Saved!" style confirmation:
//
//   const { visible, trigger, dismiss } = useSavedConfirmation();
//   ...
//   await saveThing();
//   trigger();
//   ...
//   <SavedConfirmation show={visible} onDismiss={dismiss} message="Profile updated." />
//
// Stays mounted at all times (rather than unmounting when hidden) so the
// fade/slide transition has something to animate between; `pointer-events`
// is turned off while hidden so it never blocks clicks underneath it.
export default function SavedConfirmation({ show, message = 'Saved.', onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-xs transition-all duration-300 ease-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <div className="flex items-start gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl px-4 py-3.5">
        <div className="mt-0.5 w-6 h-6 rounded-full bg-[#2D5A27]/10 dark:bg-[#4CAF50]/15 flex items-center justify-center shrink-0">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            className="text-[#2D5A27] dark:text-[#4CAF50]"
          >
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug pt-0.5">
          {message}
        </p>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="ml-auto -mr-1 -mt-1 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer shrink-0"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}