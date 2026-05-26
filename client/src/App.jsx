import Header from './components/Header.jsx';
import HomePage from './features/home/HomePage.jsx';
import MenuPage from './features/menu/MenuPage.jsx';
import CartDrawer from './features/cart/CartDrawer.jsx';
import CartFab from './features/cart/CartFab.jsx';
import CheckoutModal from './features/orders/CheckoutModal.jsx';
import AdminApp from './features/admin/AdminApp.jsx';
import DeliveryApp from './features/delivery/DeliveryApp.jsx';

export default function App() {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '/';

  if (pathname.startsWith('/admin')) return <AdminApp />;
  if (pathname.startsWith('/delivery')) return <DeliveryApp />;
  return <CustomerApp />;
}

function CustomerApp() {
  return (
    <div className="min-h-screen bg-blush-50">
      <Header />
      <main>
        <HomePage />
        <div id="menu-start" />
        <MenuPage />
      </main>
      <CartFab />
      <CartDrawer />
      <CheckoutModal />
    </div>
  );
}
