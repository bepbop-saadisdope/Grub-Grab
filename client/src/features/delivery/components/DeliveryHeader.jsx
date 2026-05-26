import { Bike, LogOut } from 'lucide-react';
import { useDeliveryStore } from '../deliveryStore.js';

export default function DeliveryHeader() {
  const user = useDeliveryStore((s) => s.user);
  const logout = useDeliveryStore((s) => s.logout);

  return (
    <header className="bg-raspberry-900 text-blush-50 border-b-4 border-berry-500">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-4xl tracking-tight text-blush-50 leading-none">
            GRUB
          </span>
          <span className="italic font-bold text-berry-300 text-sm sm:text-base uppercase flex items-center gap-1">
            <Bike size={14} /> rider
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user?.fullName && (
            <span className="hidden sm:inline text-sm text-blush-200 font-bold">
              {user.fullName}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className="flex items-center gap-2 bg-berry-500 text-blush-50 font-bold px-3 py-2 rounded-md shadow-retro-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
          >
            <LogOut size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
