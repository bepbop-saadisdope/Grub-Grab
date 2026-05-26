import adminClient from '../adminClient.js';

export const listMenuItems = () =>
  adminClient.get('/api/admin/menu').then((r) => r.data.data);

export const createMenuItem = (payload) =>
  adminClient.post('/api/admin/menu', payload).then((r) => r.data.data);

export const updateMenuItem = (itemId, payload) =>
  adminClient
    .put(`/api/admin/menu/${Number(itemId)}`, payload)
    .then((r) => r.data.data);

export const deleteMenuItem = (itemId) =>
  adminClient
    .delete(`/api/admin/menu/${Number(itemId)}`)
    .then((r) => r.data.data);

export const setMenuItemFeatured = (itemId, isFeatured) =>
  adminClient
    .patch(`/api/admin/menu/${Number(itemId)}/featured`, { isFeatured: !!isFeatured })
    .then((r) => r.data.data);
