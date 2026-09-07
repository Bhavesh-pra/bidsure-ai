import axios from 'axios';
import { ApiResponse } from '../types';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
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
    const errorPayload = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'An unexpected error occurred',
    };
    return Promise.reject(errorPayload);
  }
);
