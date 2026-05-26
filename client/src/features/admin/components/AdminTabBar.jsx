import {
  BarChart3,
  Bike,
  ClipboardList,
  Folders,
  Inbox,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { useAdminStore } from '../adminStore.js';

const ALL_TABS = [
  { id: 'orders',     label: 'Orders',     Icon: ClipboardList,    roles: ['Admin', 'SuperAdmin'] },
  { id: 'menu',       label: 'Menu',       Icon: UtensilsCrossed,  roles: ['Admin', 'SuperAdmin'] },
  { id: 'categories', label: 'Categories', Icon: Folders,          roles: ['Admin', 'SuperAdmin'] },
  { id: 'delivery',   label: 'Delivery',   Icon: Bike,             roles: ['Admin', 'SuperAdmin'] },
  { id: 'admins',     label: 'Admins',     Icon: ShieldCheck,      roles: ['SuperAdmin'] },
  { id: 'approvals',  label: 'Approvals',  Icon: Inbox,            roles: ['SuperAdmin'] },
  { id: 'stats',      label: 'Stats',      Icon: BarChart3,        roles: ['Admin', 'SuperAdmin'] },
];

export default function AdminTabBar() {
  const role = useAdminStore((s) => s.user?.role);
  const activeTab = useAdminStore((s) => s.activeTab);
  const setActiveTab = useAdminStore((s) => s.setActiveTab);

  const tabs = ALL_TABS.filter((t) => !role || t.roles.includes(role));

  return (
    <nav className="bg-blush-50 border-b-4 border-coffee-800">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 flex overflow-x-auto">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 font-display italic uppercase tracking-tight text-sm sm:text-base whitespace-nowrap border-b-4 transition-colors ${
                isActive
                  ? 'text-raspberry-900 border-raspberry-600'
                  : 'text-coffee-700 border-transparent hover:text-raspberry-900 hover:border-berry-300'
              }`}
            >
              <Icon size={18} strokeWidth={2.5} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
