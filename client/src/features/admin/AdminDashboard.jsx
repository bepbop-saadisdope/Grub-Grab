import { useAdminStore } from './adminStore.js';
import AdminHeader from './components/AdminHeader.jsx';
import AdminTabBar from './components/AdminTabBar.jsx';
import OrdersTab from './tabs/OrdersTab.jsx';
import MenuTab from './tabs/MenuTab.jsx';
import CategoriesTab from './tabs/CategoriesTab.jsx';
import DeliveryTab from './tabs/DeliveryTab.jsx';
import AdminsTab from './tabs/AdminsTab.jsx';
import ApprovalsTab from './tabs/ApprovalsTab.jsx';
import StatsTab from './tabs/StatsTab.jsx';

const TABS = {
  orders: OrdersTab,
  menu: MenuTab,
  categories: CategoriesTab,
  delivery: DeliveryTab,
  admins: AdminsTab,
  approvals: ApprovalsTab,
  stats: StatsTab,
};

export default function AdminDashboard() {
  const activeTab = useAdminStore((s) => s.activeTab);
  const ActiveTab = TABS[activeTab] ?? OrdersTab;

  return (
    <div className="min-h-screen bg-blush-50">
      <AdminHeader />
      <AdminTabBar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <ActiveTab />
      </main>
    </div>
  );
}
