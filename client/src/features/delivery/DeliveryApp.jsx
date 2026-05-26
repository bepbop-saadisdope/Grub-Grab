import { useDeliveryStore } from './deliveryStore.js';
import DeliveryLogin from './DeliveryLogin.jsx';
import DeliveryDashboard from './DeliveryDashboard.jsx';

export default function DeliveryApp() {
  const isAuthed = useDeliveryStore((s) => !!s.token);
  return isAuthed ? <DeliveryDashboard /> : <DeliveryLogin />;
}
