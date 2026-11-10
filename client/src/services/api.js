import axios from 'axios';

// Use environment variable or default to localhost
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  return 'http://localhost:5000/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  // 30s: free-tier hosts (Render) can sleep and take 20-30s to cold-start
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export let isNetworkDown = false;

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const NETWORK_ERR_CODES = ['ERR_NETWORK', 'ECONNABORTED', 'ERR_CONNECTION_REFUSED', 'ERR_BAD_RESPONSE'];

// Auto-retry idempotent (GET) requests when the network blips or the server
// is cold-starting. Real business flows (POST order/payment) are NOT retried
// automatically, so a payment/order can never be double-created by a retry.
API.interceptors.response.use(
  (res) => {
    if (isNetworkDown) {
      isNetworkDown = false;
      // Server came back — let the UI refetch through its own flows
    }
    return res;
  },
  async (err) => {
    const config = err.config || {};
    const isNetworkIssue = !err.response || NETWORK_ERR_CODES.includes(err.code);

    if (isNetworkIssue) {
      isNetworkDown = true;
    }

    // Only log errors in development
    if (import.meta.env.DEV) {
      console.error('API Error:', config?.url, err.response?.status, err.message);
    }

    // Retry up to 2 times with backoff for GET requests that failed at network level
    if (
      isNetworkIssue &&
      config.__retries === undefined
    ) {
      config.__retries = 0;
    }
    if (
      isNetworkIssue &&
      (config.method === 'get' || config.method === undefined) &&
      config.__retries < 2
    ) {
      config.__retries += 1;
      const backoff = config.__retries * 1200;
      await new Promise(r => setTimeout(r, backoff));
      return API.request(config);
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default API;
