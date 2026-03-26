import CryptoJS from 'crypto-js';

/**
 * Create a stable hash from a metrics object.
 * Used to skip re-running AI analysis when data hasn't changed.
 */
export function hashMetrics(metrics) {
  const stable = JSON.stringify(metrics, Object.keys(metrics).sort());
  return CryptoJS.MD5(stable).toString();
}