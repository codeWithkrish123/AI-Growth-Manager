import { Merchant }       from '../models/index.js';
import { NotFoundError }  from '../utils/errors.js';

/**
 * Retrieve the decrypted Shopify access token for a merchant.
 * Throws NotFoundError if merchant does not exist.
 */
export async function getAccessToken(shopDomain) {
  const merchant = await Merchant.findOne({ shopDomain, isActive: true });
  if (!merchant) throw new NotFoundError('Merchant');
  return merchant.getAccessToken();
}