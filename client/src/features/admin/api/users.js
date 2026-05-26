import adminClient from '../adminClient.js';

export const listAdmins = () =>
  adminClient.get('/api/admin/admins').then((r) => r.data.data);

export const createAdmin = (payload) =>
  adminClient
    .post('/api/admin/users/admin', payload)
    .then((r) => r.data.data);
