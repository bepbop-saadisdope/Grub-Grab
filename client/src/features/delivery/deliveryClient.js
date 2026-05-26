import axios from 'axios';
import { useDeliveryStore } from './deliveryStore.js';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const deliveryClient = axios.create({ baseURL, timeout: 10000 });

const GENERIC_ERROR = 'Something went wrong. Please try again.';

deliveryClient.interceptors.request.use((cfg) => {
  const token = useDeliveryStore.getState().token;
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

deliveryClient.interceptors.response.use(
  (res) => {
    if (res.data && res.data.success === false) {
      console.error('Delivery API error payload:', res.data);
      const serverMsg = res.data.error;
      return Promise.reject(
        new Error(typeof serverMsg === 'string' && serverMsg ? serverMsg : GENERIC_ERROR)
      );
    }
    return res;
  },
  (err) => {
    console.error('Delivery HTTP error:', err);
    if (err?.response?.status === 401) {
      useDeliveryStore.getState().logout();
    }
    const serverMsg = err?.response?.data?.error;
    return Promise.reject(
      new Error(typeof serverMsg === 'string' && serverMsg ? serverMsg : GENERIC_ERROR)
    );
  }
);

export default deliveryClient;
