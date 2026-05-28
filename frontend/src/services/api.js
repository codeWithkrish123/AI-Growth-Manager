import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  initiateAuth: (shop) => api.get(`/auth/shopify?shop=${shop}`),
  authCallback: (shop, code) => api.get(`/auth/callback?shop=${shop}&code=${code}`),
};

// Normalize shop domain to always include .myshopify.com
const normalizeShop = (shop) => {
  if (!shop) return shop;
  const clean = shop.replace('.myshopify.com', '').toLowerCase();
  return `${clean}.myshopify.com`;
};

// Dashboard API
export const dashboardAPI = {
  getDashboardData: (shop) => api.get(`/${normalizeShop(shop)}/dashboard`),
  getFixes: (shop) => api.get(`/${normalizeShop(shop)}/fixes`),
  getHealthHistory: (shop) => api.get(`/${normalizeShop(shop)}/health-history`),
  triggerSync: (shop) => api.post(`/${normalizeShop(shop)}/sync`),
  triggerAnalysis: (shop) => api.post(`/${normalizeShop(shop)}/analyze`),
  getLatestAnalysis: (shop) => api.get(`/${normalizeShop(shop)}/analysis/latest`),
  applyFix: (shop, data) => api.post(`/${normalizeShop(shop)}/fix`, data),
  getFixStatus: (shop, fixId) => api.get(`/${normalizeShop(shop)}/fix/${fixId}`),
  getSyncStatus: (shop, syncJobId) => api.get(`/${normalizeShop(shop)}/sync/${syncJobId}`),
};

// AI Actions API
export const aiAPI = {
  getAIActions: () => api.get('/ai/actions'),
  executeAIAction: (actionData) => api.post('/ai/execute', actionData),
  getAIInsights: (shop) => api.get(`/ai/insights/${normalizeShop(shop)}`),
};

// Shopify API
export const shopifyAPI = {
  getOrders: (shop) => api.get(`/api/${normalizeShop(shop)}/orders`),
  getProducts: (shop) => api.get(`/api/${normalizeShop(shop)}/products`),
  getCustomers: (shop) => api.get(`/api/${normalizeShop(shop)}/customers`),
  syncData: (shop) => api.post(`/api/${normalizeShop(shop)}/sync`),
};

// Webhook API
export const webhookAPI = {
  createWebhook: (webhookData) => api.post('/webhooks/create', webhookData),
  deleteWebhook: (webhookId) => api.delete(`/webhooks/${webhookId}`),
  getWebhooks: () => api.get('/webhooks'),
};

export default api;
