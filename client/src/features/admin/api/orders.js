import adminClient from '../adminClient.js';

export const listOrders = (status) => {
  const params = status && status !== 'All' ? { status } : {};
  return adminClient
    .get('/api/admin/orders', { params })
    .then((r) => r.data.data);
};

export const getOrderDetail = (orderId) =>
  adminClient
    .get(`/api/admin/orders/${Number(orderId)}`)
    .then((r) => r.data.data);

export const updateOrderStatus = (orderId, status) =>
  adminClient
    .patch(`/api/admin/orders/${Number(orderId)}/status`, { status })
    .then((r) => r.data.data);

export const assignDeliveryPerson = (orderId, deliveryPersonId) =>
  adminClient
    .patch(`/api/admin/orders/${Number(orderId)}/assign`, {
      deliveryPersonId: Number(deliveryPersonId),
    })
    .then((r) => r.data.data);
