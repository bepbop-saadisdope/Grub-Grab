import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Loader2,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { getStats } from '../api/stats.js';
import { formatPrice } from '../../cart/formatPrice.js';
import { StatusChip } from './statusChip.jsx';

export default function StatsTab() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await getStats();
      setStats(data || { revenueByDay: [], topItems: [], statusCounts: [] });
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    if (!stats?.revenueByDay) return { revenue: 0, orders: 0, avg: 0 };
    const revenue = stats.revenueByDay.reduce(
      (n, r) => n + Number(r.TotalRevenue || 0),
      0
    );
    const orders = stats.revenueByDay.reduce(
      (n, r) => n + Number(r.TotalOrders || 0),
      0
    );
    return { revenue, orders, avg: orders > 0 ? revenue / orders : 0 };
  }, [stats]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="font-display italic uppercase text-3xl text-raspberry-900 leading-none">
          Stats
        </h1>
        <button
          type="button"
          onClick={load}
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

      {status === 'loading' && !stats ? (
        <Loading />
      ) : status === 'error' ? (
        <ErrorState message={errorMsg} onRetry={load} />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-coffee-700 font-bold uppercase tracking-wide">
            Last 30 days · delivered orders only
          </p>

          <SummaryCards summary={summary} />

          <Section title="Revenue by Day">
            <RevenueChart days={stats?.revenueByDay || []} />
          </Section>

          <Section title="Top Items">
            <TopItems items={stats?.topItems || []} />
          </Section>

          <Section title="Order Status Breakdown (all-time)">
            <StatusCounts counts={stats?.statusCounts || []} />
          </Section>
        </div>
      )}
    </div>
  );
}

function SummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SummaryCard
        Icon={Wallet}
        label="Revenue (30d)"
        value={formatPrice(summary.revenue)}
        accent="bg-raspberry-700"
      />
      <SummaryCard
        Icon={ShoppingBag}
        label="Orders (30d)"
        value={String(summary.orders)}
        accent="bg-berry-500"
      />
      <SummaryCard
        Icon={TrendingUp}
        label="Avg Order"
        value={formatPrice(summary.avg)}
        accent="bg-raspberry-600"
      />
    </div>
  );
}

function SummaryCard({ Icon, label, value, accent }) {
  return (
    <div className="bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro overflow-hidden">
      <div className={`px-4 py-2 ${accent} text-blush-50 flex items-center gap-2`}>
        <Icon size={18} strokeWidth={2.5} />
        <span className="text-xs font-display italic uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="px-4 py-4">
        <p className="font-display text-3xl text-raspberry-900 leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro overflow-hidden">
      <header className="bg-raspberry-900 text-blush-50 px-4 py-3 border-b-4 border-coffee-800">
        <h2 className="font-display italic uppercase tracking-tight text-lg">
          {title}
        </h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function RevenueChart({ days }) {
  if (!days.length) {
    return (
      <p className="text-coffee-700 italic text-center py-6">
        No revenue data yet. Deliver an order to see this chart populate.
      </p>
    );
  }

  // Sort ascending by day so bars read left-to-right oldest → newest.
  const sorted = [...days].sort(
    (a, b) => new Date(a.OrderDay).getTime() - new Date(b.OrderDay).getTime()
  );
  const max = Math.max(...sorted.map((d) => Number(d.TotalRevenue || 0)), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 min-w-full" style={{ minHeight: '160px' }}>
        {sorted.map((d) => {
          const revenue = Number(d.TotalRevenue || 0);
          const heightPct = (revenue / max) * 100;
          const date = new Date(d.OrderDay);
          const label = `${date.getDate()}/${date.getMonth() + 1}`;
          return (
            <div
              key={d.OrderDay}
              className="flex flex-col items-center gap-1 flex-1 min-w-[28px]"
              title={`${label} · ${formatPrice(revenue)} · ${d.TotalOrders} order(s)`}
            >
              <div className="text-[10px] font-bold text-coffee-700 leading-none whitespace-nowrap">
                {revenue > 0 ? Math.round(revenue) : ''}
              </div>
              <div className="w-full bg-coffee-100 rounded-t-md relative" style={{ height: '120px' }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-raspberry-700 to-berry-500 rounded-t-md transition-all"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <div className="text-[10px] font-bold text-coffee-700 leading-none whitespace-nowrap">
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopItems({ items }) {
  if (!items.length) {
    return (
      <p className="text-coffee-700 italic text-center py-6">
        No top items yet.
      </p>
    );
  }
  const max = Math.max(...items.map((i) => Number(i.TotalSold || 0)), 1);

  return (
    <ol className="space-y-2">
      {items.map((it, idx) => {
        const sold = Number(it.TotalSold || 0);
        const widthPct = (sold / max) * 100;
        return (
          <li key={`${it.ItemName}-${idx}`} className="flex items-center gap-3">
            <span className="font-display text-coffee-700 w-6 text-right">
              #{idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-bold text-raspberry-900 truncate">
                  {it.ItemName}
                </span>
                <span className="font-black text-raspberry-900 ml-2 whitespace-nowrap">
                  {sold} sold
                </span>
              </div>
              <div className="h-3 bg-coffee-100 rounded-full overflow-hidden border border-coffee-200">
                <div
                  className="h-full bg-gradient-to-r from-raspberry-700 to-berry-500 rounded-full transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StatusCounts({ counts }) {
  if (!counts.length) {
    return (
      <p className="text-coffee-700 italic text-center py-6">
        No orders yet.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {counts.map((c) => (
        <div
          key={c.OrderStatus}
          className="bg-blush-50 border-2 border-coffee-800 rounded-lg p-3 flex items-center justify-between gap-2"
        >
          <StatusChip status={c.OrderStatus} />
          <span className="font-display text-2xl text-raspberry-900">
            {c.Count}
          </span>
        </div>
      ))}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-raspberry-900">
      <Loader2 className="animate-spin" size={42} />
      <p className="mt-3 font-bold">Loading stats…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="max-w-md mx-auto my-12 bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro p-6 text-center">
      <AlertTriangle className="mx-auto text-berry-500" size={42} />
      <h2 className="mt-3 text-xl font-black text-raspberry-900">
        Couldn't load stats
      </h2>
      <p className="mt-2 text-coffee-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 bg-berry-500 text-blush-50 font-bold px-5 py-2 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
      >
        <BarChart3 size={16} className="inline mr-1" /> Try again
      </button>
    </div>
  );
}
