import axios from 'axios';
import { useAdminStore } from './adminStore.js';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const adminClient = axios.create({ baseURL, timeout: 10000 });

const GENERIC_ERROR = 'Something went wrong. Please try again.';

adminClient.interceptors.request.use((cfg) => {
  const token = useAdminStore.getState().token;
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

adminClient.interceptors.response.use(
  (res) => {
    if (res.data && res.data.success === false) {
      console.error('Admin API error payload:', res.data);
      const serverMsg = res.data.error;
      return Promise.reject(
        new Error(typeof serverMsg === 'string' && serverMsg ? serverMsg : GENERIC_ERROR)
      );
    }
    return res;
  },
  (err) => {
    console.error('Admin HTTP error:', err);
    if (err?.response?.status === 401) {
      useAdminStore.getState().logout();
    }
    const serverMsg = err?.response?.data?.error;
    return Promise.reject(
      new Error(typeof serverMsg === 'string' && serverMsg ? serverMsg : GENERIC_ERROR)
    );
  }
);

export default adminClient;
