import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function AdminModal({
  isOpen,
  onClose,
  title,
  busy = false,
  children,
  size = 'md',
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  const widthClass = size === 'sm' ? 'max-w-sm' : 'max-w-lg';

  return (
    <>
      <div
        onClick={() => !busy && onClose()}
        aria-hidden="true"
        className="fixed inset-0 z-[60] bg-coffee-900/70"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-busy={busy}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className={`bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro w-full ${widthClass} max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto`}
        >
          <header className="flex items-center justify-between px-5 py-4 bg-raspberry-900 text-blush-50 border-b-4 border-coffee-800">
            <h2 className="font-display italic uppercase tracking-tight text-2xl truncate">
              {title}
            </h2>
            {!busy && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="bg-berry-500 text-blush-50 rounded-md p-1.5 shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            )}
          </header>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}
