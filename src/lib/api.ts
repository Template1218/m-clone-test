import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3006/api',
});

// Automatically add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
