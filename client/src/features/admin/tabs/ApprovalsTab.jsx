import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Inbox,
  Loader2,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  approveRemovalRequest,
  denyRemovalRequest,
  listRemovalRequests,
} from '../api/removalRequests.js';

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ApprovalsTab() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [resolvingId, setResolvingId] = useState(null);

  const load = useCallback(async (filterValue) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await listRemovalRequests(filterValue || undefined);
      setRequests(Array.isArray(data) ? data : []);
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const handleResolve = async (id, action) => {
    setResolvingId(id);
    setErrorMsg('');
    try {
      if (action === 'approve') await approveRemovalRequest(id);
      else await denyRemovalRequest(id);
      await load(filter);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resolve request.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="font-display italic uppercase text-3xl text-raspberry-900 leading-none">
          Approvals
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-blush-50 border-2 border-coffee-800 rounded-md px-3 py-2 text-raspberry-900 font-bold focus:outline-none focus:ring-2 focus:ring-raspberry-300"
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Denied">Denied</option>
            <option value="">All</option>
          </select>
          <button
            type="button"
            onClick={() => load(filter)}
            disabled={status === 'loading'}
            aria-label="Refresh"
            className="bg-raspberry-600 text-blush-50 font-bold px-3 py-2 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={18}
              strokeWidth={2.5}
              className={status === 'loading' ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {errorMsg && status === 'ready' && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 bg-raspberry-50 border-2 border-raspberry-700 rounded-md p-3 text-raspberry-900"
        >
          <AlertTriangle
            size={18}
            strokeWidth={2.5}
            className="text-raspberry-700 shrink-0 mt-0.5"
          />
          <p className="text-sm font-bold">{errorMsg}</p>
        </div>
      )}

      {status === 'loading' && requests.length === 0 ? (
        <Loading />
      ) : status === 'error' ? (
        <ErrorBlock message={errorMsg} onRetry={() => load(filter)} />
      ) : requests.length === 0 ? (
        <Empty filter={filter} />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <RequestCard
              key={r.RequestID}
              req={r}
              busy={resolvingId === r.RequestID}
              onApprove={() => handleResolve(r.RequestID, 'approve')}
              onDeny={() => handleResolve(r.RequestID, 'deny')}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestCard({ req, busy, onApprove, onDeny }) {
  const isPending = req.Status === 'Pending';
  return (
    <li className="bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro-sm overflow-hidden">
      <header className="flex items-start justify-between gap-3 px-4 py-3 bg-raspberry-900 text-blush-50">
        <div className="min-w-0">
          <p className="font-display italic uppercase tracking-tight text-lg leading-tight">
            Remove · {req.TargetName}
          </p>
          <p className="text-xs text-blush-200 font-bold mt-0.5">
            {req.TargetRole}
            {req.TargetPhone ? ` · ${req.TargetPhone}` : ''}
            {req.TargetEmail ? ` · ${req.TargetEmail}` : ''}
          </p>
        </div>
        <StatusBadge status={req.Status} />
      </header>

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start gap-2 bg-blush-100 border-2 border-coffee-300 rounded-md p-3">
          <ShieldAlert
            size={16}
            strokeWidth={2.5}
            className="text-coffee-700 shrink-0 mt-0.5"
          />
          <p className="text-sm text-coffee-900 leading-snug whitespace-pre-wrap">
            {req.Reason}
          </p>
        </div>
        <p className="text-xs text-coffee-700 font-bold">
          Filed by {req.RequestedByName} · {formatDate(req.CreatedAt)}
        </p>
        {!isPending && (
          <p className="text-xs text-coffee-700 italic">
            Resolved {formatDate(req.ResolvedAt)}
            {req.ResolutionNote ? ` · "${req.ResolutionNote}"` : ''}
          </p>
        )}
      </div>

      {isPending && (
        <footer className="px-4 py-3 bg-coffee-50 border-t-2 border-coffee-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDeny}
            disabled={busy}
            className="flex items-center gap-1 bg-coffee-700 text-blush-50 font-bold px-3 py-1.5 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <X size={14} strokeWidth={2.5} />
            )}
            Deny
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={busy}
            className="flex items-center gap-1 bg-berry-500 text-blush-50 font-display italic uppercase tracking-wide px-4 py-1.5 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} strokeWidth={3} />
            )}
            Approve & disable
          </button>
        </footer>
      )}
    </li>
  );
}

function StatusBadge({ status }) {
  const styles =
    status === 'Approved'
      ? 'bg-raspberry-700 text-blush-50'
      : status === 'Denied'
      ? 'bg-coffee-700 text-blush-50'
      : 'bg-berry-500 text-blush-50';
  return (
    <span
      className={`shrink-0 inline-block px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wide ${styles}`}
    >
      {status}
    </span>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-raspberry-900">
      <Loader2 className="animate-spin" size={42} />
      <p className="mt-3 font-bold">Loading requests…</p>
    </div>
  );
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div className="max-w-md mx-auto my-12 bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro p-6 text-center">
      <AlertTriangle className="mx-auto text-berry-500" size={42} />
      <h2 className="mt-3 text-xl font-black text-raspberry-900">
        Couldn't load
      </h2>
      <p className="mt-2 text-coffee-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 bg-berry-500 text-blush-50 font-bold px-5 py-2 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
      >
        Try again
      </button>
    </div>
  );
}

function Empty({ filter }) {
  return (
    <div className="text-center py-16">
      <Inbox className="mx-auto text-coffee-400" size={48} strokeWidth={2} />
      <p className="mt-3 font-display italic uppercase text-2xl text-raspberry-900">
        {filter === 'Pending' ? 'Inbox zero' : 'No requests'}
      </p>
      <p className="mt-2 text-coffee-700">
        {filter === 'Pending'
          ? 'Nothing waiting on your approval.'
          : `No removal requests with status "${filter || 'any'}".`}
      </p>
    </div>
  );
}
