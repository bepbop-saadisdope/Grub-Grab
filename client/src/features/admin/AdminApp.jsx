import { useAdminStore } from './adminStore.js';
import AdminLogin from './AdminLogin.jsx';
import AdminDashboard from './AdminDashboard.jsx';

export default function AdminApp() {
  const isAuthed = useAdminStore((s) => !!s.token);
  return isAuthed ? <AdminDashboard /> : <AdminLogin />;
}
