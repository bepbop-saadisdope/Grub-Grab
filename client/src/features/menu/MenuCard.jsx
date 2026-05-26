import { Plus, UtensilsCrossed } from 'lucide-react';
import { useCartStore } from '../cart/cartStore.js';
import { formatPrice } from '../cart/formatPrice.js';

export default function MenuCard({ item }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div className="group bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro hover:scale-[1.02] hover:-translate-y-1 transition-transform duration-200 overflow-hidden flex flex-col">
      <div className="relative h-44 bg-gradient-to-br from-raspberry-700 to-berry-500 overflow-hidden">
        {item.ImageURL ? (
          <img
            src={item.ImageURL}
            alt={item.ItemName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-blush-50 group-hover:scale-110 transition-transform duration-300">
            <UtensilsCrossed size={56} strokeWidth={2.5} />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-black text-raspberry-900 leading-tight">
          {item.ItemName}
        </h3>
        {item.Description && (
          <p className="mt-1 text-sm text-coffee-700 line-clamp-2">
            {item.Description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="bg-berry-500 text-blush-50 font-black px-3 py-1.5 rounded-md shadow-retro-sm">
            {formatPrice(item.Price)}
          </span>
          <button
            type="button"
            onClick={() => addItem(item)}
            className="flex items-center gap-1 bg-raspberry-700 text-blush-50 font-bold px-4 py-2 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
          >
            <Plus size={16} strokeWidth={3} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
