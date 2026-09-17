import axios from 'axios';
import { ApiResponse } from '../types';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Return inner envelope data if present
    if (response.data && response.data.success !== undefined) {
      return response.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    const errorPayload = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'An unexpected error occurred',
    };
    return Promise.reject(errorPayload);
  }
);
