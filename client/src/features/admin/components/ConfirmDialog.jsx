import { AlertTriangle, Loader2 } from 'lucide-react';
import AdminModal from './AdminModal.jsx';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  busy = false,
  errorMsg = '',
}) {
  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title} busy={busy} size="sm">
      <div className="px-5 py-5 space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 bg-raspberry-50 border-2 border-raspberry-700 rounded-md p-3 text-raspberry-900"
          >
            <AlertTriangle
              size={18}
              strokeWidth={2.5}
              className="text-raspberry-700 shrink-0 mt-0.5"
            />
            <p className="text-sm font-bold">{errorMsg}</p>
          </div>
        )}
        <p className="text-coffee-900">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 font-bold text-coffee-900 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex items-center gap-2 ${
              destructive ? 'bg-berry-500' : 'bg-raspberry-600'
            } text-blush-50 font-display italic uppercase tracking-wide px-5 py-2 rounded-md border-4 border-coffee-800 shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0`}
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Working…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
