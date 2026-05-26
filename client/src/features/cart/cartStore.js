import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const MAX_QTY = 99;
const MAX_NAME_LEN = 200;

const sanitizeItem = (raw) => {
  const id = Number(raw?.MenuItemID);
  const price = Number(raw?.Price);
  const qty = Math.floor(Number(raw?.qty));
  const nameRaw = typeof raw?.ItemName === 'string' ? raw.ItemName : null;
  const name = nameRaw ? nameRaw.slice(0, MAX_NAME_LEN) : null;

  if (!Number.isInteger(id) || id <= 0) return null;
  if (!name || name.trim() === '') return null;
  if (!Number.isFinite(price) || price < 0) return null;
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;

  return { MenuItemID: id, ItemName: name, Price: price, qty };
};

const sanitizeItems = (raw) =>
  Array.isArray(raw) ? raw.map(sanitizeItem).filter(Boolean) : [];

const clampQty = (n) =>
  Math.max(1, Math.min(MAX_QTY, Math.floor(Number(n) || 1)));

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isCheckoutOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      openCheckout: () => set({ isCheckoutOpen: true }),
      closeCheckout: () => set({ isCheckoutOpen: false }),

      addItem: (raw) =>
        set((state) => {
          const sanitized = sanitizeItem({ ...raw, qty: 1 });
          if (!sanitized) return state;

          const existing = state.items.find(
            (x) => x.MenuItemID === sanitized.MenuItemID
          );
          if (existing) {
            return {
              items: state.items.map((x) =>
                x.MenuItemID === sanitized.MenuItemID
                  ? { ...x, qty: Math.min(MAX_QTY, x.qty + 1) }
                  : x
              ),
            };
          }
          return { items: [...state.items, sanitized] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((x) => x.MenuItemID !== Number(id)),
        })),

      updateQuantity: (id, qty) =>
        set((state) => ({
          items: state.items.map((x) =>
            x.MenuItemID === Number(id) ? { ...x, qty: clampQty(qty) } : x
          ),
        })),

      clearCart: () => set({ items: [] }),

      totalCount: () => get().items.reduce((n, i) => n + i.qty, 0),
      total: () => get().items.reduce((n, i) => n + i.qty * i.Price, 0),
    }),
    {
      name: 'grub-cart-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        items: sanitizeItems(persisted?.items),
      }),
    }
  )
);
