import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2, X } from 'lucide-react';
import {
  assignDeliveryPerson,
  getOrderDetail,
  updateOrderStatus,
} from '../api/orders.js';
import { listDeliveryPersons } from '../api/deliveryPersons.js';
import { formatPrice } from '../../cart/formatPrice.js';
import { ORDER_STATUSES, StatusChip } from './statusChip.jsx';

export default function OrderDetailDrawer({ orderId, onClose, onChanged }) {
  const isOpen = !!orderId;
  const [order, setOrder] = useState(null);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [phase, setPhase] = useState('loading'); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);
  const [confirm, setConfirm] = useState('');

  const isBusy = savingStatus || savingAssign;

  const load = useCallback(async (id) => {
    setPhase('loading');
    setErrorMsg('');
    try {
      const [detail, dps] = await Promise.all([
        getOrderDetail(id),
        listDeliveryPersons().catch(() => []),
      ]);
      setOrder(detail);
      setDeliveryPersons(Array.isArray(dps) ? dps : []);
      setPhase('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    if (!orderId) return;
    setConfirm('');
    load(orderId);
  }, [orderId, load]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !isBusy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isBusy, onClose]);

  const handleStatusChange = async (next) => {
    if (!order || next === order.OrderStatus) return;
    setSavingStatus(true);
    setConfirm('');
    setErrorMsg('');
    try {
      await updateOrderStatus(order.OrderID, next);
      setOrder((prev) => (prev ? { ...prev, OrderStatus: next } : prev));
      setConfirm('Status updated');
      onChanged?.();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAssign = async (next) => {
    if (!order) return;
    const id = Number(next);
    if (!Number.isInteger(id) || id <= 0) return;
    setSavingAssign(true);
    setConfirm('');
    setErrorMsg('');
    try {
      await assignDeliveryPerson(order.OrderID, id);
      const dp = deliveryPersons.find((p) => p.UserID === id);
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              DeliveryPersonID: id,
              DeliveryPersonName: dp?.FullName || prev.DeliveryPersonName,
              DeliveryPersonPhone: dp?.PhoneNumber || prev.DeliveryPersonPhone,
            }
          : prev
      );
      setConfirm('Delivery person assigned');
      onChanged?.();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to assign delivery person.');
    } finally {
      setSavingAssign(false);
    }
  };

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  return (
    <>
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-coffee-900/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        role="dialog"
        aria-label="Order detail"
        aria-hidden={!isOpen}
        aria-busy={isBusy}
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-blush-50 border-l-4 border-coffee-800 shadow-retro z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between px-5 py-4 bg-raspberry-900 text-blush-50 border-b-4 border-coffee-800">
          <div className="min-w-0">
            <h2 className="font-display italic uppercase tracking-tight text-2xl truncate">
              {order ? `Order #${order.OrderID}` : 'Order'}
            </h2>
            {order && (
              <p className="text-sm text-blush-200 mt-0.5">
                {formatPrice(order.TotalAmount)} ·{' '}
                <span className="inline-block align-middle">
                  <StatusChip status={order.OrderStatus} />
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            aria-label="Close"
            className="bg-berry-500 text-blush-50 rounded-md p-1.5 shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform disabled:opacity-50"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {phase === 'loading' && <LoadingBlock />}

          {phase === 'error' && (
            <ErrorBlock message={errorMsg} onRetry={() => load(orderId)} />
          )}

          {phase === 'ready' && order && (
            <>
              {confirm && (
                <div className="flex items-center gap-2 bg-blush-100 border-2 border-raspberry-600 rounded-md p-2 text-raspberry-700">
                  <Check size={18} strokeWidth={3} />
                  <span className="text-sm font-bold">{confirm}</span>
                </div>
              )}

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

              <Section title="Customer">
                <KV label="Name" value={order.CustomerName} />
                <KV label="Phone" value={order.CustomerPhone} />
                <KV label="Address" value={order.DeliveryAddress} />
                {order.DeliveryCity && (
                  <KV label="City" value={order.DeliveryCity} />
                )}
              </Section>

              <Section title="Items">
                <div className="border-2 border-coffee-800 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-coffee-100 text-coffee-900">
                      <tr>
                        <th className="text-left px-2 py-2 font-black uppercase tracking-wide text-xs">
                          Item
                        </th>
                        <th className="text-right px-2 py-2 font-black uppercase tracking-wide text-xs">
                          Qty
                        </th>
                        <th className="text-right px-2 py-2 font-black uppercase tracking-wide text-xs">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-coffee-200">
                      {(order.items || []).map((it) => (
                        <tr key={it.OrderDetailID}>
                          <td className="px-2 py-2">
                            <div className="font-bold text-raspberry-900">
                              {it.ItemName}
                            </div>
                            <div className="text-xs text-coffee-700">
                              @ {formatPrice(it.UnitPrice)}
                            </div>
                            {it.SpecialRequest && (
                              <div className="text-xs italic text-coffee-700 mt-0.5">
                                "{it.SpecialRequest}"
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right font-black text-raspberry-900">
                            {it.Quantity}
                          </td>
                          <td className="px-2 py-2 text-right font-black text-raspberry-900 whitespace-nowrap">
                            {formatPrice(it.Subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              {order.SpecialInstructions && (
                <Section title="Special instructions">
                  <p className="bg-blush-100 border-2 border-coffee-300 rounded-md p-3 italic text-coffee-900">
                    {order.SpecialInstructions}
                  </p>
                </Section>
              )}

              <Section title="Update status">
                <select
                  value={order.OrderStatus}
                  disabled={savingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-blush-50 border-2 border-coffee-800 rounded-md px-3 py-2 font-bold text-raspberry-900 focus:outline-none focus:ring-2 focus:ring-raspberry-300 disabled:opacity-60"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {savingStatus && (
                  <p className="mt-1 text-xs text-coffee-700 flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" /> Saving…
                  </p>
                )}
              </Section>

              <Section title="Delivery person">
                <select
                  value={order.DeliveryPersonID ?? ''}
                  disabled={savingAssign || deliveryPersons.length === 0}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="w-full bg-blush-50 border-2 border-coffee-800 rounded-md px-3 py-2 font-bold text-raspberry-900 focus:outline-none focus:ring-2 focus:ring-raspberry-300 disabled:opacity-60"
                >
                  <option value="" disabled>
                    {deliveryPersons.length === 0
                      ? 'No delivery persons available'
                      : 'Select a delivery person'}
                  </option>
                  {deliveryPersons.map((p) => (
                    <option key={p.UserID} value={p.UserID}>
                      {p.FullName} {p.PhoneNumber ? `· ${p.PhoneNumber}` : ''}
                    </option>
                  ))}
                </select>
                {savingAssign && (
                  <p className="mt-1 text-xs text-coffee-700 flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" /> Assigning…
                  </p>
                )}
              </Section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="font-display italic uppercase tracking-tight text-lg text-raspberry-900 mb-2">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function KV({ label, value }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-coffee-700 font-bold uppercase tracking-wide w-20 shrink-0">
        {label}
      </span>
      <span className="text-raspberry-900 font-medium">{value || '—'}</span>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-raspberry-900">
      <Loader2 className="animate-spin" size={36} />
      <p className="mt-3 font-bold">Loading order…</p>
    </div>
  );
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="mx-auto text-berry-500" size={36} />
      <p className="mt-3 font-black text-raspberry-900">{message}</p>
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
