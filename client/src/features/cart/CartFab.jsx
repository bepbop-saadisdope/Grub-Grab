import { ShoppingBag } from 'lucide-react';
import { useCartStore } from './cartStore.js';

export default function CartFab() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const isOpen = useCartStore((s) => s.isOpen);
  const openCart = useCartStore((s) => s.openCart);

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart${count > 0 ? `, ${count} items` : ''}`}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-raspberry-700 text-blush-50 font-bold pl-4 pr-5 py-3 rounded-full border-4 border-coffee-800 shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-retro-sm transition-transform"
    >
      <ShoppingBag size={22} strokeWidth={2.5} />
      <span className="font-display text-lg tracking-wide">CART</span>
      {count > 0 && (
        <span className="ml-1 bg-berry-500 text-blush-50 text-xs font-black rounded-full min-w-[1.5rem] h-6 px-1.5 flex items-center justify-center border-2 border-coffee-800">
          {count}
        </span>
      )}
    </button>
  );
}
