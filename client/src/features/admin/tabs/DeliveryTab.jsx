import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bike,
  Loader2,
  Plus,
  Power,
  RefreshCw,
} from 'lucide-react';
import {
  listDeliveryPersons,
  toggleUserStatus,
} from '../api/deliveryPersons.js';
import { useAdminStore } from '../adminStore.js';
import DeliveryPersonForm from './DeliveryPersonForm.jsx';
import RequestRemovalModal from './RequestRemovalModal.jsx';

export default function DeliveryTab() {
  const role = useAdminStore((s) => s.user?.role);
  const isSuperAdmin = role === 'SuperAdmin';

  const [people, setPeople] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [removalTarget, setRemovalTarget] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await listDeliveryPersons();
      setPeople(Array.isArray(data) ? data : []);
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (person) => {
    const isCurrentlyActive = person.IsActive === true || person.IsActive === 1;

    // Admins cannot disable directly — they file a removal request.
    // Reactivation is SuperAdmin-only either way.
    if (!isSuperAdmin) {
      if (isCurrentlyActive) {
        setRemovalTarget(person);
      } else {
        setErrorMsg('Only a SuperAdmin can reactivate a disabled rider.');
      }
      return;
    }

    setTogglingId(person.UserID);
    try {
      await toggleUserStatus(person.UserID, !isCurrentlyActive);
      setPeople((prev) =>
        prev.map((p) =>
          p.UserID === person.UserID ? { ...p, IsActive: !isCurrentlyActive } : p
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
          Delivery
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
            Add Rider
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

      {status === 'loading' && people.length === 0 ? (
        <LoadingState />
      ) : status === 'error' ? (
        <ErrorState message={errorMsg} onRetry={load} />
      ) : people.length === 0 ? (
        <EmptyState />
      ) : (
        <PeopleTable
          people={people}
          togglingId={togglingId}
          onToggle={handleToggle}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      <DeliveryPersonForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <RequestRemovalModal
        isOpen={!!removalTarget}
        onClose={() => setRemovalTarget(null)}
        onSubmitted={() => setErrorMsg('')}
        target={removalTarget}
      />
    </div>
  );
}

function PeopleTable({ people, togglingId, onToggle, isSuperAdmin }) {
  return (
    <div className="overflow-x-auto bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro">
      <table className="w-full text-left">
        <thead className="bg-raspberry-900 text-blush-50">
          <tr>
            <Th>Name</Th>
            <Th>Phone</Th>
            <Th className="hidden md:table-cell">Vehicle</Th>
            <Th>On Duty</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-coffee-200">
          {people.map((p) => {
            const active = p.IsActive === true || p.IsActive === 1;
            const available = p.IsAvailable === true || p.IsAvailable === 1;
            const busy = togglingId === p.UserID;
            return (
              <tr key={p.UserID} className="hover:bg-blush-100">
                <Td>
                  <div className="font-black text-raspberry-900 flex items-center gap-2">
                    <Bike size={16} className="text-coffee-700" />
                    {p.FullName}
                  </div>
                </Td>
                <Td className="text-coffee-700 whitespace-nowrap">
                  {p.PhoneNumber || '—'}
                </Td>
                <Td className="hidden md:table-cell text-coffee-700">
                  {p.VehicleType || '—'}
                  {p.VehicleNumber && (
                    <span className="text-xs ml-1 text-coffee-500">
                      · {p.VehicleNumber}
                    </span>
                  )}
                </Td>
                <Td>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wide ${
                      available
                        ? 'bg-raspberry-700 text-blush-50'
                        : 'bg-coffee-300 text-coffee-900'
                    }`}
                  >
                    {available ? 'Free' : 'On Run'}
                  </span>
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
                    onClick={() => onToggle(p)}
                    disabled={busy || (!isSuperAdmin && !active)}
                    aria-label={
                      active
                        ? isSuperAdmin
                          ? `Disable ${p.FullName}`
                          : `Request removal of ${p.FullName}`
                        : `Activate ${p.FullName}`
                    }
                    title={
                      !isSuperAdmin && !active
                        ? 'Only a SuperAdmin can reactivate'
                        : undefined
                    }
                    className={`inline-flex items-center gap-1 ${
                      active ? 'bg-berry-500' : 'bg-raspberry-600'
                    } text-blush-50 font-bold px-2.5 py-1.5 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {busy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Power size={14} strokeWidth={2.5} />
                    )}
                    <span className="hidden sm:inline">
                      {active
                        ? isSuperAdmin
                          ? 'Disable'
                          : 'Request removal'
                        : 'Activate'}
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
      <p className="mt-3 font-bold">Loading riders…</p>
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
        No riders yet
      </p>
      <p className="mt-2 text-coffee-700">
        Click <span className="font-black">Add Rider</span> to onboard your first delivery person.
      </p>
    </div>
  );
}
