import { success } from '../utils/response.js';

const stub = (name) => (_req, res) => success(res, { message: `${name} - coming soon`, data: [] });

export const runSeoAudit = stub('runSeoAudit');
export const getLatestSeoAudit = stub('getLatestSeoAudit');
export const getSeoAuditHistory = stub('getSeoAuditHistory');
export const getSeoIssues = stub('getSeoIssues');
export const fixSeoIssue = stub('fixSeoIssue');
export const fixAllSeoIssues = stub('fixAllSeoIssues');
export const getProductSeoScores = stub('getProductSeoScores');
export const aiOptimizeProduct = stub('aiOptimizeProduct');
export const aiOptimizeAllProducts = stub('aiOptimizeAllProducts');
export const previewSeoChanges = stub('previewSeoChanges');
export const getSeoKeywords = stub('getSeoKeywords');
export const addSeoKeyword = stub('addSeoKeyword');
export const deleteSeoKeyword = stub('deleteSeoKeyword');
export const getKeywordRankings = stub('getKeywordRankings');
export const aiSuggestKeywords = stub('aiSuggestKeywords');
export const getSchemaMarkup = stub('getSchemaMarkup');
export const generateSchemaMarkup = stub('generateSchemaMarkup');
export const applySchemaMarkup = stub('applySchemaMarkup');
export const getPageSpeedScores = stub('getPageSpeedScores');
export const getPageSpeedHistory = stub('getPageSpeedHistory');
export const addCompetitor = stub('addCompetitor');
export const analyzeCompetitors = stub('analyzeCompetitors');
export const getMetaTags = stub('getMetaTags');
export const bulkUpdateMetaTags = stub('bulkUpdateMetaTags');
export const aiGenerateMetaTags = stub('aiGenerateMetaTags');
