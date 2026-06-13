import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      // Only redirect if not already on a public page
      const pub = ['/', '/signin', '/onboarding', '/pricing', '/about', '/resources'];
      if (!pub.some(p => window.location.pathname.startsWith(p))) {
        window.location.href = '/onboarding';
      }
    }
    return Promise.reject(error);
  }
);

const s = (shop) => {
  if (!shop) return shop;
  const clean = shop.replace('.myshopify.com', '').toLowerCase();
  return `${clean}.myshopify.com`;
};

export const dashboardAPI = {
  getDashboardData:    (shop)              => api.get(`${s(shop)}/dashboard`),
  getProducts:         (shop)              => api.get(`${s(shop)}/products`),
  createProduct:       (shop, data)        => api.post(`${s(shop)}/products/create`, data),
  getFixes:            (shop)              => api.get(`${s(shop)}/fixes`),
  getHealthHistory:    (shop)              => api.get(`${s(shop)}/health-history`),
  triggerSync:         (shop)              => api.post(`${s(shop)}/sync`),
  triggerAnalysis:     (shop)              => api.post(`${s(shop)}/analyze`),
  getLatestAnalysis:   (shop)              => api.get(`${s(shop)}/analysis/latest`),
  applyFix:            (shop, data)        => api.post(`${s(shop)}/fix`, data),
  getFixStatus:        (shop, fixId)       => api.get(`${s(shop)}/fix/${fixId}`),
  getSyncStatus:       (shop, syncJobId)   => api.get(`${s(shop)}/sync/${syncJobId}`),
  // Email
  getEmailCampaigns:   (shop)              => api.get(`${s(shop)}/email/campaigns`),
  createEmailCampaign: (shop, data)        => api.post(`${s(shop)}/email/campaigns`, data),
  generateAiEmail:     (shop, data)        => api.post(`${s(shop)}/email/ai-generate`, data),
  aiPromptComposeEmail:(shop, data)        => api.post(`${s(shop)}/email/ai-prompt-compose`, data),
  sendEmailCampaign:   (shop, id)          => api.post(`${s(shop)}/email/campaigns/${id}/send`),
  getEmailAnalytics:   (shop)              => api.get(`${s(shop)}/email/analytics`),
  // AI Features
  generateDescriptions:(shop, data = {})   => api.post(`${s(shop)}/ai/generate-descriptions`, data),
  previewDescriptions: (shop)              => api.post(`${s(shop)}/ai/generate-descriptions`, { preview: true }),
  optimizePrices:      (shop, data = {})   => api.post(`${s(shop)}/ai/optimize-prices`, data),
  // Ads
  getAdsAccounts:      (shop)              => api.get(`${s(shop)}/ads/accounts`),
  connectAdAccount:    (shop, platform, data) => api.post(`${s(shop)}/ads/connect/${platform}`, data),
  disconnectAdAccount: (shop, id)          => api.delete(`${s(shop)}/ads/accounts/${id}`),
  getAdsCampaigns:     (shop)              => api.get(`${s(shop)}/ads/campaigns`),
  createAdsCampaign:   (shop, data)        => api.post(`${s(shop)}/ads/campaigns`, data),
  aiGenerateAdsCampaign:(shop, data = {})  => api.post(`${s(shop)}/ads/campaigns/ai-generate`, data),
  pauseAdsCampaign:    (shop, id)          => api.post(`${s(shop)}/ads/campaigns/${id}/pause`),
  resumeAdsCampaign:   (shop, id)          => api.post(`${s(shop)}/ads/campaigns/${id}/resume`),
  getAdsPerformance:   (shop)              => api.get(`${s(shop)}/ads/performance`),
  getAdsSuggestions:   (shop)              => api.get(`${s(shop)}/ads/ai/suggestions`),
  applyAdsSuggestion:  (shop, id)          => api.post(`${s(shop)}/ads/ai/suggestions/${id}/apply`),
  aiBudgetOptimize:    (shop)              => api.post(`${s(shop)}/ads/ai/budget-optimize`),
  aiCreativeGenerate:  (shop, data)        => api.post(`${s(shop)}/ads/ai/creative-generate`, data),
  // SEO
  runSeoAudit:         (shop)              => api.post(`${s(shop)}/seo/audit/run`),
  getLatestSeoAudit:   (shop)              => api.get(`${s(shop)}/seo/audit/latest`),
  getSeoAuditHistory:  (shop)              => api.get(`${s(shop)}/seo/audit/history`),
  getSeoIssues:        (shop)              => api.get(`${s(shop)}/seo/issues`),
  fixSeoIssue:         (shop, id)          => api.post(`${s(shop)}/seo/issues/${id}/fix`),
  fixAllSeoIssues:     (shop)              => api.post(`${s(shop)}/seo/issues/fix-all`),
  getSeoKeywords:      (shop)              => api.get(`${s(shop)}/seo/keywords`),
  addSeoKeyword:       (shop, data)        => api.post(`${s(shop)}/seo/keywords`, data),
  deleteSeoKeyword:    (shop, id)          => api.delete(`${s(shop)}/seo/keywords/${id}`),
  getMetaTags:         (shop)              => api.get(`${s(shop)}/seo/meta-tags`),
  aiGenerateMetaTags:  (shop, data)        => api.post(`${s(shop)}/seo/meta-tags/ai-generate`, data),
};

export const authAPI = {
  getStatus: (shop) => api.get(`/auth/status?shop=${s(shop)}`),
};

// Safely extract a string message from axios error responses
// Backend returns { error: { code, message } } — not a plain string
export const errMsg = (e, fallback = 'Something went wrong') =>
  e.response?.data?.error?.message || e.response?.data?.error || e.message || fallback;

export default api;
