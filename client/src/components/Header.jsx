import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '../features/cart/cartStore.js';

export default function Header() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const openCart = useCartStore((s) => s.openCart);

  return (
    <header className="bg-raspberry-900 text-blush-50 border-b-4 border-berry-500">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-4xl sm:text-5xl tracking-tight text-blush-50 leading-none">
            GRUB
          </span>
          <span className="italic font-bold text-berry-300 text-sm sm:text-base hidden sm:inline">
            Grab the goodness
          </span>
        </div>

        <button
          type="button"
          onClick={openCart}
          className="relative bg-berry-500 text-blush-50 rounded-lg p-2 sm:p-3 shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
          aria-label="Open cart"
        >
          <ShoppingBag size={22} />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-blush-50 text-raspberry-900 text-xs font-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-coffee-800">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
