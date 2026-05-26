import deliveryClient from '../deliveryClient.js';

export const login = ({ phoneNumber, password }) =>
  deliveryClient
    .post('/api/delivery/login', {
      phoneNumber: String(phoneNumber).trim(),
      password: String(password),
    })
    .then((r) => r.data.data);
