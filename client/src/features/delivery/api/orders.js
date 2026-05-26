import deliveryClient from '../deliveryClient.js';

export const listOrders = () =>
  deliveryClient.get('/api/delivery/orders').then((r) => r.data.data);

export const listActiveOrders = () =>
  deliveryClient
    .get('/api/delivery/orders/active')
    .then((r) => r.data.data);

export const updateOrderStatus = (orderId, status) =>
  deliveryClient
    .patch(`/api/delivery/orders/${Number(orderId)}/status`, { status })
    .then((r) => r.data.data);
