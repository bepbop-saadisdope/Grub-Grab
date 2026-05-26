import adminClient from '../adminClient.js';

export const listDeliveryPersons = () =>
  adminClient
    .get('/api/admin/delivery-persons')
    .then((r) => r.data.data);

export const createDeliveryPerson = (payload) => {
  const body = { ...payload };
  if (body.phoneNumber) body.phoneNumber = String(body.phoneNumber).trim();
  return adminClient
    .post('/api/admin/users/delivery-person', body)
    .then((r) => r.data.data);
};

export const toggleUserStatus = (userId, isActive) =>
  adminClient
    .patch(`/api/admin/users/${Number(userId)}/status`, { isActive: !!isActive })
    .then((r) => r.data.data);
