import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useDeliveryStore } from './deliveryStore.js';
import { listOrders, listActiveOrders } from './api/orders.js';
import DeliveryHeader from './components/DeliveryHeader.jsx';
import OrderCard from './components/OrderCard.jsx';

export default function DeliveryDashboard() {
  const view = useDeliveryStore((s) => s.view);
  const setView = useDeliveryStore((s) => s.setView);

  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const load = useCallback(async (which) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = which === 'active' ? await listActiveOrders() : await listOrders();
      setOrders(Array.isArray(data) ? data : []);
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load(view);
  }, [view, load]);

  return (
    <div className="min-h-screen bg-blush-50">
      <DeliveryHeader />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex bg-blush-50 border-2 border-coffee-800 rounded-md overflow-hidden">
            <ViewButton
              active={view === 'active'}
              onClick={() => setView('active')}
            >
              Active
            </ViewButton>
            <ViewButton
              active={view === 'all'}
              onClick={() => setView('all')}
            >
              All
            </ViewButton>
          </div>
          <button
            type="button"
            onClick={() => load(view)}
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

        {status === 'loading' && orders.length === 0 ? (
          <Loading />
        ) : status === 'error' ? (
          <Error message={errorMsg} onRetry={() => load(view)} />
        ) : orders.length === 0 ? (
          <Empty view={view} />
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <OrderCard
                key={o.OrderID}
                order={o}
                onChanged={() => load(view)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ViewButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 font-display italic uppercase tracking-tight text-sm transition-colors ${
        active
          ? 'bg-raspberry-900 text-blush-50'
          : 'bg-blush-50 text-coffee-700 hover:bg-blush-100'
      }`}
    >
      {children}
    </button>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-raspberry-900">
      <Loader2 className="animate-spin" size={42} />
      <p className="mt-3 font-bold">Loading orders…</p>
    </div>
  );
}

function Error({ message, onRetry }) {
  return (
    <div className="bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro p-6 text-center">
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

function Empty({ view }) {
  return (
    <div className="text-center py-20">
      <p className="font-display italic uppercase text-2xl text-raspberry-900">
        {view === 'active' ? 'No active deliveries' : 'No orders yet'}
      </p>
      <p className="mt-2 text-coffee-700">
        {view === 'active'
          ? 'You\'re all caught up. Check back when an order is assigned.'
          : 'You haven\'t been assigned any orders yet.'}
      </p>
    </div>
  );
}
