import { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Truck,
  User,
} from 'lucide-react';
import { formatPrice } from '../../cart/formatPrice.js';
import { StatusChip } from '../../admin/tabs/statusChip.jsx';
import { updateOrderStatus } from '../api/orders.js';

export default function OrderCard({ order, onChanged }) {
  const [busy, setBusy] = useState(null); // null | 'Out for Delivery' | 'Delivered'
  const [errorMsg, setErrorMsg] = useState('');

  const handleAction = async (next) => {
    setBusy(next);
    setErrorMsg('');
    try {
      await updateOrderStatus(order.OrderID, next);
      onChanged?.();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update status.');
    } finally {
      setBusy(null);
    }
  };

  const canStart =
    order.OrderStatus === 'Confirmed' || order.OrderStatus === 'Preparing';
  const canDeliver = order.OrderStatus === 'Out for Delivery';

  return (
    <article className="bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro overflow-hidden">
      <header className="px-4 py-3 bg-raspberry-900 text-blush-50 flex items-center justify-between">
        <div>
          <p className="font-display italic uppercase tracking-tight text-xl">
            Order #{order.OrderID}
          </p>
          {order.TotalAmount != null && (
            <p className="text-sm text-blush-200 font-bold">
              {formatPrice(order.TotalAmount)}
            </p>
          )}
        </div>
        <StatusChip status={order.OrderStatus} />
      </header>

      <div className="px-4 py-3 space-y-2">
        <Row Icon={User} label="Customer" value={order.CustomerName} />
        <Row
          Icon={Phone}
          label="Phone"
          value={
            order.CustomerPhone ? (
              <a
                href={`tel:${order.CustomerPhone}`}
                className="underline text-raspberry-700 font-bold"
              >
                {order.CustomerPhone}
              </a>
            ) : (
              '—'
            )
          }
        />
        <Row
          Icon={MapPin}
          label="Address"
          value={
            <>
              {order.DeliveryAddress}
              {order.DeliveryCity && (
                <span className="text-coffee-700">, {order.DeliveryCity}</span>
              )}
            </>
          }
        />
        {order.SpecialInstructions && (
          <p className="bg-blush-100 border-2 border-coffee-300 rounded-md p-2 italic text-sm text-coffee-900">
            "{order.SpecialInstructions}"
          </p>
        )}
      </div>

      {(canStart || canDeliver) && (
        <footer className="px-4 py-3 bg-coffee-50 border-t-4 border-coffee-800 space-y-2">
          {errorMsg && (
            <p className="text-sm font-bold text-raspberry-700">{errorMsg}</p>
          )}
          <div className="flex items-center gap-2">
            {canStart && (
              <button
                type="button"
                onClick={() => handleAction('Out for Delivery')}
                disabled={busy !== null}
                className="flex-1 flex items-center justify-center gap-2 bg-raspberry-600 text-blush-50 font-display italic uppercase tracking-wide px-4 py-2.5 rounded-md border-4 border-coffee-800 shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {busy === 'Out for Delivery' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Truck size={18} strokeWidth={2.5} />
                )}
                Pick up
              </button>
            )}
            {canDeliver && (
              <button
                type="button"
                onClick={() => handleAction('Delivered')}
                disabled={busy !== null}
                className="flex-1 flex items-center justify-center gap-2 bg-raspberry-700 text-blush-50 font-display italic uppercase tracking-wide px-4 py-2.5 rounded-md border-4 border-coffee-800 shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {busy === 'Delivered' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={18} strokeWidth={2.5} />
                )}
                Mark delivered
              </button>
            )}
          </div>
        </footer>
      )}
    </article>
  );
}

function Row({ Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon size={16} className="text-coffee-700 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <span className="block text-xs font-black text-coffee-700 uppercase tracking-wide">
          {label}
        </span>
        <span className="block text-raspberry-900 font-medium break-words">
          {value || '—'}
        </span>
      </div>
    </div>
  );
}
