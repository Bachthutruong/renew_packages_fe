import axios from 'axios';
import { AuthResponse, DataWithPercentage, PhoneBrand, ImportResponse } from '../types';

const API_BASE_URL = 'https://renew-packages-be.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/admin/login')) {
        console.error('Authentication error, redirecting to login');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
};

// Data API
export const dataAPI = {
  importExcel: async (file: File): Promise<ImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/data/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getB1Values: async (): Promise<string[]> => {
    const response = await api.get('/data/b1');
    return response.data;
  },

  getB2Data: async (b1?: string): Promise<DataWithPercentage[]> => {
    const response = await api.get('/data/b2', {
      params: { b1 },
    });
    return response.data;
  },

  getB3Data: async (b1?: string, b2?: string): Promise<DataWithPercentage[]> => {
    const response = await api.get('/data/b3', {
      params: { b1, b2 },
    });
    return response.data;
  },

  getB3Details: async (b1: string, b2: string, b3: string): Promise<string[]> => {
    const response = await api.get('/data/b3/details', {
      params: { b1, b2, b3 },
    });
    return response.data;
  },

  updateB2Percentage: async (b1: string, value: string, percentage: number): Promise<void> => {
    await api.put('/data/b2/percentage', { b1, value, percentage });
  },

  updateB3Percentage: async (b1: string, b2: string, value: string, percentage: number): Promise<void> => {
    await api.put('/data/b3/percentage', { b1, b2, value, percentage });
  },

  clearAllConfigurations: async (): Promise<void> => {
    await api.delete('/data/configurations');
  },

  migratePercentageConfigs: async (): Promise<void> => {
    await api.post('/data/migrate-percentage-configs');
  },
};

// Phone Brands API
export const phoneBrandsAPI = {
  getAll: async (): Promise<PhoneBrand[]> => {
    const response = await api.get('/phone-brands');
    return response.data;
  },

  create: async (name: string, percentage: number): Promise<PhoneBrand> => {
    const response = await api.post('/phone-brands', { name, percentage });
    return response.data;
  },

  update: async (id: string, name: string, percentage: number): Promise<PhoneBrand> => {
    const response = await api.put(`/phone-brands/${id}`, { name, percentage });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/phone-brands/${id}`);
  },
}; 