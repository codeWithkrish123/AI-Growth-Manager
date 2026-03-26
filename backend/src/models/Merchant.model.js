import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

const merchantSchema = new mongoose.Schema(
  {
    shopDomain: {
      type:     String,
      required: true,
      unique:   true,
      lowercase: true,
      trim:     true,
    },

    // AES-256 encrypted — never stored as plain text
    accessTokenEnc: { type: String, required: true },

    scope:    { type: String },
    isActive: { type: Boolean, default: true },

    planTier: {
      type:    String,
      enum:    ['free', 'starter', 'pro', 'enterprise'],
      default: 'free',
    },

    shopInfo: {
      name:        String,
      email:       String,
      currency:    String,
      timezone:    String,
      countryCode: String,
      planName:    String,
    },

    lastSyncAt: Date,
  },
  { timestamps: true }
);

// Encrypt before saving
merchantSchema.methods.setAccessToken = function (plain) {
  this.accessTokenEnc = encrypt(plain);
};

// Decrypt on demand
merchantSchema.methods.getAccessToken = function () {
  return decrypt(this.accessTokenEnc);
};

merchantSchema.index({ shopDomain: 1 });

export const Merchant = mongoose.model('Merchant', merchantSchema);