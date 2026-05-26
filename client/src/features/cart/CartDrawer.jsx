import { useEffect } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCartStore } from './cartStore.js';
import { formatPrice } from './formatPrice.js';

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const items = useCartStore((s) => s.items);
  const closeCart = useCartStore((s) => s.closeCart);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const openCheckout = useCartStore((s) => s.openCheckout);

  const subtotal = items.reduce((n, i) => n + i.qty * i.Price, 0);
  const isEmpty = items.length === 0;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeCart]);

  const handleCheckout = () => {
    if (items.length === 0) return;
    openCheckout();
  };

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-coffee-900/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        role="dialog"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-coffee-50 border-l-4 border-coffee-800 shadow-retro z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b-4 border-raspberry-900 bg-raspberry-900 text-blush-50">
          <h2 className="font-display italic uppercase tracking-tight text-2xl">
            Your Bag
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="bg-berry-500 text-blush-50 rounded-md p-1.5 shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </header>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={48} className="text-coffee-400" strokeWidth={2} />
            <p className="mt-4 font-display italic uppercase text-2xl text-raspberry-900">
              Your bag is empty
            </p>
            <p className="mt-2 text-coffee-700">
              Tap <span className="font-black">Add</span> on any menu item to start your bag.
            </p>
            <button
              type="button"
              onClick={closeCart}
              className="mt-6 bg-raspberry-700 text-blush-50 font-bold px-5 py-2 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
            >
              Browse menu
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((item) => {
                const lineTotal = item.qty * item.Price;
                return (
                  <li
                    key={item.MenuItemID}
                    className="bg-blush-50 border-2 border-coffee-800 rounded-xl p-3 shadow-retro-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-black text-raspberry-900 leading-tight truncate">
                          {item.ItemName}
                        </h3>
                        <p className="text-sm text-coffee-700 mt-0.5">
                          {formatPrice(item.Price)} each
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.MenuItemID)}
                        aria-label={`Remove ${item.ItemName}`}
                        className="text-coffee-700 hover:text-raspberry-700 transition-colors p-1"
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.MenuItemID, item.qty - 1)
                          }
                          disabled={item.qty <= 1}
                          aria-label="Decrease quantity"
                          className="bg-coffee-800 text-blush-50 rounded-md p-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-coffee-900 transition-colors"
                        >
                          <Minus size={16} strokeWidth={3} />
                        </button>
                        <span className="font-black text-raspberry-900 min-w-[1.5rem] text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.MenuItemID, item.qty + 1)
                          }
                          aria-label="Increase quantity"
                          className="bg-raspberry-700 text-blush-50 rounded-md p-1.5 hover:bg-raspberry-800 transition-colors"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      </div>
                      <span className="bg-berry-500 text-blush-50 font-black px-2.5 py-1 rounded-md text-sm shadow-retro-sm">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="border-t-4 border-coffee-800 bg-coffee-50 px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display italic uppercase text-xl text-raspberry-900">
                  Subtotal
                </span>
                <span className="font-display text-2xl text-raspberry-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full bg-raspberry-600 text-blush-50 font-display italic uppercase tracking-wide text-xl py-3 rounded-md border-4 border-coffee-800 shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-retro-sm transition-transform"
              >
                Checkout
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full text-sm font-bold text-coffee-700 underline hover:text-raspberry-700 transition-colors"
              >
                Clear cart
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
