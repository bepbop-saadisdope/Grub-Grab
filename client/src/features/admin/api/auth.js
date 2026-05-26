import adminClient from '../adminClient.js';

export const login = ({ email, password }) =>
  adminClient
    .post('/api/admin/login', {
      email: String(email).trim(),
      password: String(password),
    })
    .then((r) => r.data.data);
