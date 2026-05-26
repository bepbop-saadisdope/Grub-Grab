import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Eye, Loader2, RefreshCw } from 'lucide-react';
import { listOrders } from '../api/orders.js';
import { formatPrice } from '../../cart/formatPrice.js';
import { ORDER_STATUSES, StatusChip } from './statusChip.jsx';
import OrderDetailDrawer from './OrderDetailDrawer.jsx';

const FILTER_OPTIONS = ['All', ...ORDER_STATUSES];

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

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [openOrderId, setOpenOrderId] = useState(null);

  const load = useCallback(async (filterValue) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await listOrders(filterValue);
      setOrders(Array.isArray(data) ? data : []);
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const handleStatusChanged = () => {
    load(filter);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="font-display italic uppercase text-3xl text-raspberry-900 leading-none">
          Orders
        </h1>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-blush-50 border-2 border-coffee-800 rounded-md px-3 py-2 text-raspberry-900 font-bold focus:outline-none focus:ring-2 focus:ring-raspberry-300"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => load(filter)}
            aria-label="Refresh"
            disabled={status === 'loading'}
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

      {status === 'loading' && orders.length === 0 ? (
        <LoadingState />
      ) : status === 'error' ? (
        <ErrorState message={errorMsg} onRetry={() => load(filter)} />
      ) : orders.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <OrdersTable
          orders={orders}
          onOpen={(id) => setOpenOrderId(id)}
        />
      )}

      <OrderDetailDrawer
        orderId={openOrderId}
        onClose={() => setOpenOrderId(null)}
        onChanged={handleStatusChanged}
      />
    </div>
  );
}

function OrdersTable({ orders, onOpen }) {
  return (
    <div className="overflow-x-auto bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro">
      <table className="w-full text-left">
        <thead className="bg-raspberry-900 text-blush-50">
          <tr>
            <Th>Order #</Th>
            <Th>Date</Th>
            <Th>Customer</Th>
            <Th className="hidden md:table-cell">Phone</Th>
            <Th>Total</Th>
            <Th>Status</Th>
            <Th className="hidden lg:table-cell">Delivery</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-coffee-200">
          {orders.map((o) => (
            <tr
              key={o.OrderID}
              className="hover:bg-blush-100 cursor-pointer"
              onClick={() => onOpen(o.OrderID)}
            >
              <Td>
                <span className="font-black text-raspberry-900">
                  #{o.OrderID}
                </span>
              </Td>
              <Td className="text-coffee-700 whitespace-nowrap">
                {formatDate(o.OrderDate)}
              </Td>
              <Td>
                <span className="font-bold text-raspberry-900">
                  {o.CustomerName || '—'}
                </span>
              </Td>
              <Td className="hidden md:table-cell text-coffee-700 whitespace-nowrap">
                {o.CustomerPhone || '—'}
              </Td>
              <Td>
                <span className="font-black text-raspberry-900 whitespace-nowrap">
                  {formatPrice(o.TotalAmount)}
                </span>
              </Td>
              <Td>
                <StatusChip status={o.OrderStatus} />
              </Td>
              <Td className="hidden lg:table-cell text-coffee-700">
                {o.DeliveryPersonName || (
                  <span className="italic text-coffee-500">Unassigned</span>
                )}
              </Td>
              <Td className="text-right">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(o.OrderID);
                  }}
                  aria-label={`View order ${o.OrderID}`}
                  className="inline-flex items-center gap-1 bg-raspberry-600 text-blush-50 font-bold px-3 py-1.5 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
                >
                  <Eye size={16} strokeWidth={2.5} />
                  View
                </button>
              </Td>
            </tr>
          ))}
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
      <p className="mt-3 font-bold">Loading orders…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="max-w-md mx-auto my-12 bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro p-6 text-center">
      <AlertTriangle className="mx-auto text-berry-500" size={42} />
      <h2 className="mt-3 text-xl font-black text-raspberry-900">
        Couldn't load orders
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

function EmptyState({ filter }) {
  return (
    <div className="text-center py-20">
      <p className="font-display italic uppercase text-2xl text-raspberry-900">
        No orders
      </p>
      <p className="mt-2 text-coffee-700">
        {filter === 'All'
          ? 'No orders have been placed yet.'
          : `No orders with status "${filter}".`}
      </p>
    </div>
  );
}
