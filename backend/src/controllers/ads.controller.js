import { success, error } from '../utils/response.js';

const stub = (name) => (_req, res) => success(res, { message: `${name} - coming soon`, data: [] });

export const getAdsAccounts = stub('getAdsAccounts');
export const connectAdAccount = stub('connectAdAccount');
export const disconnectAdAccount = stub('disconnectAdAccount');
export const getAdsCampaigns = stub('getAdsCampaigns');
export const createAdsCampaign = stub('createAdsCampaign');
export const updateAdsCampaign = stub('updateAdsCampaign');
export const pauseAdsCampaign = stub('pauseAdsCampaign');
export const resumeAdsCampaign = stub('resumeAdsCampaign');
export const getAdsPerformance = stub('getAdsPerformance');
export const getCampaignPerformance = stub('getCampaignPerformance');
export const getAdsPerformanceTrend = stub('getAdsPerformanceTrend');
export const getAdsSuggestions = stub('getAdsSuggestions');
export const applyAdsSuggestion = stub('applyAdsSuggestion');
export const aiBudgetOptimize = stub('aiBudgetOptimize');
export const aiAudienceSuggest = stub('aiAudienceSuggest');
export const aiCreativeGenerate = stub('aiCreativeGenerate');
export const aiGenerateCampaign = stub('aiGenerateCampaign');
