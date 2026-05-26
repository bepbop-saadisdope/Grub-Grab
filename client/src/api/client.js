import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const client = axios.create({ baseURL, timeout: 10000 });

const GENERIC_ERROR = 'Something went wrong. Please try again.';

client.interceptors.response.use(
  (res) => {
    if (res.data && res.data.success === false) {
      console.error('API error payload:', res.data);
      const serverMsg = res.data.error;
      return Promise.reject(
        new Error(typeof serverMsg === 'string' && serverMsg ? serverMsg : GENERIC_ERROR)
      );
    }
    return res;
  },
  (err) => {
    console.error('HTTP error:', err);
    const serverMsg = err?.response?.data?.error;
    return Promise.reject(
      new Error(typeof serverMsg === 'string' && serverMsg ? serverMsg : GENERIC_ERROR)
    );
  }
);

export default client;
