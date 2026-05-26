import adminClient from '../adminClient.js';

export const getStats = () =>
  adminClient.get('/api/admin/stats').then((r) => r.data.data);
