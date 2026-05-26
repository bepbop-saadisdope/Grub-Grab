export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const STATUS_STYLES = {
  Pending: 'bg-blush-200 text-coffee-900',
  Confirmed: 'bg-berry-200 text-raspberry-700',
  Preparing: 'bg-berry-300 text-raspberry-800',
  'Out for Delivery': 'bg-raspberry-400 text-blush-50',
  Delivered: 'bg-raspberry-700 text-blush-50',
  Cancelled: 'bg-coffee-700 text-blush-50',
};

export function StatusChip({ status }) {
  const style = STATUS_STYLES[status] || 'bg-coffee-200 text-coffee-900';
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wide ${style}`}
    >
      {status}
    </span>
  );
}
