// import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// // Create axios instance
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Request interceptor to add auth token if available
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor to handle errors
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // Handle unauthorized access
//       localStorage.removeItem('authToken');
//       window.location.href = '/signin';
//     }
//     return Promise.reject(error);
//   }
// );

// // Auth API
// export const authAPI = {
//   initiateAuth: (shop) => api.get(`/auth/auth?shop=${shop}`),
//   authCallback: (shop, code) => api.get(`/auth/callback?shop=${shop}&code=${code}`),
// };

// // Dashboard API
// export const dashboardAPI = {
//   getDashboardData: (shop) => api.get(`/dashboard/${shop}`),
// };

// // AI Actions API
// export const aiAPI = {
//   getAIActions: () => api.get('/ai/actions'),
//   executeAIAction: (actionData) => api.post('/ai/execute', actionData),
//   getAIInsights: (shop) => api.get(`/ai/insights/${shop}`),
// };

// // Shopify API
// export const shopifyAPI = {
//   getOrders: (shop) => api.get(`/shopify/orders/${shop}`),
//   getProducts: (shop) => api.get(`/shopify/products/${shop}`),
//   getCustomers: (shop) => api.get(`/shopify/customers/${shop}`),
//   syncData: (shop) => api.post(`/shopify/sync/${shop}`),
// };

// // Webhook API
// export const webhookAPI = {
//   createWebhook: (webhookData) => api.post('/webhooks/create', webhookData),
//   deleteWebhook: (webhookId) => api.delete(`/webhooks/${webhookId}`),
//   getWebhooks: () => api.get('/webhooks'),
// };

// export default api;
