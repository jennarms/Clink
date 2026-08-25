import { createPortal } from 'react-dom';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">{title}</h3>
        {message && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{message}</p>}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 font-medium text-sm rounded-xl transition cursor-pointer text-white ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#2D5A27] hover:bg-[#23471e] dark:bg-[#4CAF50] dark:hover:bg-[#3d9142]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}