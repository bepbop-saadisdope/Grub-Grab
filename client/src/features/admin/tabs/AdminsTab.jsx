import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { listAdmins } from '../api/users.js';
import { toggleUserStatus } from '../api/deliveryPersons.js';
import { useAdminStore } from '../adminStore.js';
import AdminForm from './AdminForm.jsx';

export default function AdminsTab() {
  const currentUserId = useAdminStore((s) => s.user?.userId);

  const [admins, setAdmins] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await listAdmins();
      setAdmins(Array.isArray(data) ? data : []);
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (admin) => {
    const next = !(admin.IsActive === true || admin.IsActive === 1);
    setTogglingId(admin.UserID);
    try {
      await toggleUserStatus(admin.UserID, next);
      setAdmins((prev) =>
        prev.map((a) =>
          a.UserID === admin.UserID ? { ...a, IsActive: next } : a
        )
      );
    } catch (err) {
      setErrorMsg(err.message || 'Failed to toggle status.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="font-display italic uppercase text-3xl text-raspberry-900 leading-none">
          Admins
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={status === 'loading'}
            aria-label="Refresh"
            className="bg-blush-50 border-2 border-coffee-800 text-raspberry-900 font-bold p-2 rounded-md hover:bg-blush-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={18}
              strokeWidth={2.5}
              className={status === 'loading' ? 'animate-spin' : ''}
            />
          </button>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 bg-raspberry-600 text-blush-50 font-bold px-3 py-2 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add Admin
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

      {status === 'loading' && admins.length === 0 ? (
        <LoadingState />
      ) : status === 'error' ? (
        <ErrorState message={errorMsg} onRetry={load} />
      ) : admins.length === 0 ? (
        <EmptyState />
      ) : (
        <AdminsTable
          admins={admins}
          currentUserId={currentUserId}
          togglingId={togglingId}
          onToggle={handleToggle}
        />
      )}

      <AdminForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  );
}

function AdminsTable({ admins, currentUserId, togglingId, onToggle }) {
  return (
    <div className="overflow-x-auto bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro">
      <table className="w-full text-left">
        <thead className="bg-raspberry-900 text-blush-50">
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th className="hidden md:table-cell">Phone</Th>
            <Th className="hidden md:table-cell">CNIC</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-coffee-200">
          {admins.map((a) => {
            const active = a.IsActive === true || a.IsActive === 1;
            const isSelf = a.UserID === currentUserId;
            const busy = togglingId === a.UserID;
            return (
              <tr key={a.UserID} className="hover:bg-blush-100">
                <Td>
                  <div className="font-black text-raspberry-900 flex items-center gap-2">
                    <Shield size={16} className="text-coffee-700" />
                    {a.FullName}
                    {isSelf && (
                      <span className="text-xs italic text-coffee-500">
                        (you)
                      </span>
                    )}
                  </div>
                </Td>
                <Td className="text-coffee-700 whitespace-nowrap">
                  {a.Email || '—'}
                </Td>
                <Td className="hidden md:table-cell text-coffee-700 whitespace-nowrap">
                  {a.PhoneNumber || '—'}
                </Td>
                <Td className="hidden md:table-cell text-coffee-700 whitespace-nowrap">
                  {a.Cnic || '—'}
                </Td>
                <Td>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wide ${
                      active
                        ? 'bg-raspberry-700 text-blush-50'
                        : 'bg-coffee-700 text-blush-50'
                    }`}
                  >
                    {active ? 'Active' : 'Disabled'}
                  </span>
                </Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => onToggle(a)}
                    disabled={busy || isSelf}
                    aria-label={active ? `Disable ${a.FullName}` : `Activate ${a.FullName}`}
                    title={isSelf ? "You can't disable your own account" : ''}
                    className={`inline-flex items-center gap-1 ${
                      active ? 'bg-berry-500' : 'bg-raspberry-600'
                    } text-blush-50 font-bold px-2.5 py-1.5 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {busy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Power size={14} strokeWidth={2.5} />
                    )}
                    <span className="hidden sm:inline">
                      {active ? 'Disable' : 'Activate'}
                    </span>
                  </button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = '' }) {
  return (
    <th
      className={`px-3 py-3 text-xs font-display italic uppercase tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = '' }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>;
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-raspberry-900">
      <Loader2 className="animate-spin" size={42} />
      <p className="mt-3 font-bold">Loading admins…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
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

function EmptyState() {
  return (
    <div className="text-center py-20">
      <p className="font-display italic uppercase text-2xl text-raspberry-900">
        No admins yet
      </p>
      <p className="mt-2 text-coffee-700">
        Click <span className="font-black">Add Admin</span> to onboard your first one.
      </p>
    </div>
  );
}
