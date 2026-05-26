import client from '../../api/client.js';

export const getCategories = () =>
  client.get('/api/menu/categories').then((r) => r.data.data);

export const getItems = () =>
  client.get('/api/menu/items').then((r) => r.data.data);
