import axios from 'axios';
import { AuthResponse, DataWithPercentage, PhoneBrand, ImportResponse } from '../types';

const API_BASE_URL = 'https://renew-packages-be.onrender.com/api';
// const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Simple cache implementation
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes

  private isValidCacheItem<T>(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (item && this.isValidCacheItem(item)) {
      return item.data;
    }
    if (item) {
      this.cache.delete(key); // Remove expired item
    }
    return null;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new APICache();

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API Request] Adding auth token to request:', config.url);
  } else {
    console.log('[API Request] No auth token available for request:', config.url);
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    const url = error.config?.url;
    
    console.log('[API Interceptor] Request failed:', {
      status,
      url,
      method: error.config?.method,
      currentPath,
      hasToken: !!localStorage.getItem('token')
    });
    
    // Only clear auth for actual authentication/authorization failures on protected endpoints
    if (status === 401 || status === 403) {
      console.warn('[API Interceptor] Authentication error detected');
      
      // Don't clear auth for validation endpoint 404 (endpoint might not exist yet)
      if (url?.includes('/auth/validate') && status === 404) {
        console.log('[API Interceptor] Ignoring 404 on validate endpoint - backend might not have this route');
        return Promise.reject(error);
      }
      
      // Only clear tokens and redirect for actual auth failures on existing endpoints
      if (error.response && !currentPath.includes('/admin/login')) {
        console.log('[API Interceptor] Clearing authentication and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        apiCache.clear();
        
        console.error('Authentication error, redirecting to login');
        window.location.href = '/admin/login';
      }
    } else if (!error.response) {
      // Network error - don't clear authentication
      console.warn('[API Interceptor] Network error, keeping authentication:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { username, password });
    // Clear cache on login
    apiCache.clear();
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
    // Clear cache after import
    apiCache.clear();
    return response.data;
  },

  getB1Values: async (): Promise<string[]> => {
    const cacheKey = 'b1Values';
    const cached = apiCache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await api.get('/data/b1');
    const data = response.data;
    apiCache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes for B1 values
    return data;
  },

  getB2Data: async (b1?: string): Promise<DataWithPercentage[]> => {
    if (!b1) return [];
    
    const cacheKey = `b2Data:${b1}`;
    const cached = apiCache.get<DataWithPercentage[]>(cacheKey);
    if (cached) {
      console.log(`[Frontend] Returning cached B2 data for B1: ${b1}`, cached);
      return cached;
    }

    console.log(`[Frontend] 🔄 Fetching B2 data for B1: ${b1}`);
    console.log(`[Frontend] 📡 API URL: ${API_BASE_URL}/data/b2?b1=${encodeURIComponent(b1)}`);
    
    try {
      const response = await api.get('/data/b2', {
        params: { b1 },
      });
      console.log(`[Frontend] ✅ API Response:`, response);
      console.log(`[Frontend] 📊 B2 Data:`, response.data);
      
      const data = response.data;
      apiCache.set(cacheKey, data);
      return data;
    } catch (error: any) {
      console.error(`[Frontend] ❌ API Error:`, error);
      console.error(`[Frontend] 🔍 Error details:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  },

  getB3Data: async (b1?: string, b2?: string): Promise<DataWithPercentage[]> => {
    if (!b1 || !b2) return [];
    
    const cacheKey = `b3Data:${b1}:${b2}`;
    const cached = apiCache.get<DataWithPercentage[]>(cacheKey);
    if (cached) {
      console.log(`[Frontend] Returning cached B3 data for B1: ${b1}, B2: ${b2}`);
      return cached;
    }

    console.log(`[Frontend] Fetching B3 data for B1: ${b1}, B2: ${b2}`);
    const response = await api.get('/data/b3', {
      params: { b1, b2 },
    });
    const data = response.data;
    apiCache.set(cacheKey, data);
    return data;
  },

  getB3Details: async (b1: string, b2: string, b3: string): Promise<string[]> => {
    const cacheKey = `b3Details:${b1}:${b2}:${b3}`;
    const cached = apiCache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await api.get('/data/b3/details', {
      params: { b1, b2, b3 },
    });
    const data = response.data;
    apiCache.set(cacheKey, data, 10 * 60 * 1000); // 10 minutes for details
    return data;
  },

  updateB2Percentage: async (b1: string, value: string, percentage: number): Promise<void> => {
    await api.put('/data/b2/percentage', { b1, value, percentage });
    // Clear related cache
    apiCache.clearByPrefix(`b2Data:${b1}`);
  },

  updateB3Percentage: async (b1: string, b2: string, value: string, percentage: number): Promise<void> => {
    await api.put('/data/b3/percentage', { b1, b2, value, percentage });
    // Clear related cache
    apiCache.clearByPrefix(`b3Data:${b1}:${b2}`);
  },

  clearAllConfigurations: async (): Promise<void> => {
    await api.delete('/data/configurations');
    // Clear percentage-related cache
    apiCache.clearByPrefix('b2Data');
    apiCache.clearByPrefix('b3Data');
  },

  migratePercentageConfigs: async (): Promise<void> => {
    await api.post('/data/migrate-percentage-configs');
    // Clear cache after migration
    apiCache.clear();
  },
};

// Phone Brands API
export const phoneBrandsAPI = {
  getAll: async (): Promise<PhoneBrand[]> => {
    const cacheKey = 'phoneBrands';
    const cached = apiCache.get<PhoneBrand[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await api.get('/phone-brands');
    const data = response.data;
    apiCache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
    return data;
  },

  create: async (name: string, percentage: number): Promise<PhoneBrand> => {
    const response = await api.post('/phone-brands', { name, percentage });
    // Clear phone brands cache
    apiCache.clearByPrefix('phoneBrands');
    return response.data;
  },

  update: async (id: string, name: string, percentage: number): Promise<PhoneBrand> => {
    const response = await api.put(`/phone-brands/${id}`, { name, percentage });
    // Clear phone brands cache
    apiCache.clearByPrefix('phoneBrands');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/phone-brands/${id}`);
    // Clear phone brands cache
    apiCache.clearByPrefix('phoneBrands');
  },
}; 