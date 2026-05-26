import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import AdminModal from '../components/AdminModal.jsx';
import { createRemovalRequest } from '../api/removalRequests.js';

export default function RequestRemovalModal({
  isOpen,
  onClose,
  onSubmitted,
  target,
}) {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setReason('');
    setReasonError('');
    setErrorMsg('');
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 5 || trimmed.length > 500) {
      setReasonError('Please give a reason (5–500 characters).');
      return;
    }
    if (!target?.UserID) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await createRemovalRequest({
        targetUserId: target.UserID,
        reason: trimmed,
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to file request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Request removal"
      busy={submitting}
    >
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <div className="bg-blush-100 border-2 border-coffee-300 rounded-md p-3 flex items-start gap-2">
          <ShieldAlert
            size={20}
            strokeWidth={2.5}
            className="text-raspberry-700 shrink-0 mt-0.5"
          />
          <div className="text-sm text-coffee-900">
            <p>
              Submitting will send this request to a SuperAdmin. The user stays
              active until approved.
            </p>
            {target && (
              <p className="mt-1 font-bold text-raspberry-900">
                Target: {target.FullName}
                {target.PhoneNumber ? ` · ${target.PhoneNumber}` : ''}
              </p>
            )}
          </div>
        </div>

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

        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-black text-coffee-900 mb-1.5 uppercase tracking-wide"
          >
            Reason
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError) setReasonError('');
            }}
            disabled={submitting}
            rows={4}
            maxLength={500}
            placeholder="Why should this user be removed?"
            className={`w-full bg-blush-50 border-2 rounded-md px-3 py-2 text-raspberry-900 font-medium focus:outline-none focus:border-raspberry-700 focus:ring-2 focus:ring-raspberry-300 disabled:opacity-60 resize-none ${
              reasonError ? 'border-raspberry-700' : 'border-coffee-800'
            }`}
          />
          <div className="flex justify-between mt-1 text-xs">
            {reasonError ? (
              <p className="font-bold text-raspberry-700">{reasonError}</p>
            ) : (
              <span />
            )}
            <span className="text-coffee-700">{reason.length}/500</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 font-bold text-coffee-900 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-berry-500 text-blush-50 font-display italic uppercase tracking-wide px-5 py-2 rounded-md border-4 border-coffee-800 shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-retro-sm transition-transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-retro"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit request'
            )}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
