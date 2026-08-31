import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://final-web-backend-eta.vercel.app/api',
  // Note: Agar CRA hai toh `process.env.REACT_APP_API_URL` use karein.
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;