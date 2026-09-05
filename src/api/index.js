import axios from 'axios';

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'https://final-web-backend-eta.vercel.app/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;