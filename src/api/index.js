import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Apne backend ka port check karein (5000 / 8000)
});

// Request mein JWT token bhejne ke liye
API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  }
  return req;
});

export default API;