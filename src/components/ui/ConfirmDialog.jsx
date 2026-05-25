// src/components/ui/ConfirmDialog.jsx
import { clsx } from "clsx";

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{message}</p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              "rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
              danger
                ? "bg-red-600 text-white hover:bg-red-500"
                : "bg-white text-black hover:bg-zinc-200"
            )}
          >
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}
