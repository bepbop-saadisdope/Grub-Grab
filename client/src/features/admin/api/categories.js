import adminClient from '../adminClient.js';

export const listCategories = () =>
  adminClient.get('/api/admin/categories').then((r) => r.data.data);

export const createCategory = (payload) =>
  adminClient
    .post('/api/admin/categories', payload)
    .then((r) => r.data.data);

export const updateCategory = (categoryId, payload) =>
  adminClient
    .put(`/api/admin/categories/${Number(categoryId)}`, payload)
    .then((r) => r.data.data);

export const deleteCategory = (categoryId) =>
  adminClient
    .delete(`/api/admin/categories/${Number(categoryId)}`)
    .then((r) => r.data.data);
