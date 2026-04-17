import axios from 'axios';

// Use environment variable or default to localhost
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    console.log('✅ Using API URL from env:', envUrl);
    return envUrl;
  }
  const defaultUrl = 'http://localhost:5000/api';
  console.log('⚠️ Using default API URL:', defaultUrl);
  return defaultUrl;
};

const API = axios.create({ 
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log('📤 API Request:', config.method.toUpperCase(), config.url);
  return config;
});

API.interceptors.response.use(
  (res) => {
    console.log('📥 API Response:', res.status, res.config.url);
    return res;
  },
  (err) => {
    console.error('❌ API Error:', err.config?.url, err.response?.status, err.message);
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
