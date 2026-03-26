import mongoose from 'mongoose';

// ─── Fix Action ───────────────────────────────────────────────────────────────
const fixActionSchema = new mongoose.Schema(
  {
    merchantId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant',    required: true },
    analysisId:  { type: mongoose.Schema.Types.ObjectId, ref: 'AiAnalysis',  required: true },
    shopDomain:  { type: String, required: true },
    problemId:   { type: String, required: true },
    fixType:     { type: String, required: true },
    payload:     mongoose.Schema.Types.Mixed,
    status: {
      type:    String,
      enum:    ['pending', 'applying', 'applied', 'failed', 'rolled_back'],
      default: 'pending',
    },
    shopifyResponse: mongoose.Schema.Types.Mixed,
    appliedAt:       Date,
    errorMsg:        String,
    attemptCount:    { type: Number, default: 0 },
    triggeredBy:     { type: String, enum: ['merchant', 'auto'], default: 'merchant' },
  },
  { timestamps: true }
);
fixActionSchema.index({ merchantId: 1, createdAt: -1 });
fixActionSchema.index({ status: 1 });
export const FixAction = mongoose.model('FixAction', fixActionSchema);

// ─── Sync Job ─────────────────────────────────────────────────────────────────
const syncJobSchema = new mongoose.Schema(
  {
    merchantId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    shopDomain:  { type: String, required: true },
    jobType: {
      type:    String,
      enum:    ['full_sync', 'partial_sync', 'analysis', 'fix'],
      default: 'full_sync',
    },
    status: {
      type:    String,
      enum:    ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
    },
    bullJobId:    String,
    startedAt:    Date,
    completedAt:  Date,
    durationMs:   Number,
    result: {
      ordersCount:    Number,
      productsCount:  Number,
      customersCount: Number,
      snapshotId:     { type: mongoose.Schema.Types.ObjectId, ref: 'StoreSnapshot' },
    },
    errorMsg:     String,
    attemptCount: { type: Number, default: 0 },
    maxAttempts:  { type: Number, default: 3 },
  },
  { timestamps: true }
);
syncJobSchema.index({ merchantId: 1, createdAt: -1 });
syncJobSchema.index({ status: 1, createdAt: -1 });
export const SyncJob = mongoose.model('SyncJob', syncJobSchema);

// ─── Webhook Event ────────────────────────────────────────────────────────────
const webhookEventSchema = new mongoose.Schema(
  {
    shopDomain:       { type: String, required: true },
    topic:            { type: String, required: true },
    payload:          mongoose.Schema.Types.Mixed,
    processed:        { type: Boolean, default: false },
    processedAt:      Date,
    shopifyWebhookId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);
webhookEventSchema.index({ shopDomain: 1, topic: 1 });
webhookEventSchema.index({ processed: 1, createdAt: 1 });
export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

// ─── Health History ───────────────────────────────────────────────────────────
const healthHistorySchema = new mongoose.Schema(
  {
    merchantId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    shopDomain:  { type: String, required: true },
    date:        { type: Date, required: true },
    score:       { type: Number, min: 0, max: 100 },
    breakdown: {
      conversionScore: Number,
      abandonScore:    Number,
      aovScore:        Number,
      productScore:    Number,
      inventoryScore:  Number,
      retentionScore:  Number,
    },
    aov:             Number,
    cartAbandonRate: Number,
    conversionRate:  Number,
  },
  { timestamps: true }
);
healthHistorySchema.index({ merchantId: 1, date: -1 }, { unique: true });
export const HealthHistory = mongoose.model('HealthHistory', healthHistorySchema);

// ─── AI Call Log ──────────────────────────────────────────────────────────────
const aiCallLogSchema = new mongoose.Schema(
  {
    merchantId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    shopDomain:       String,
    callType:         { type: String, enum: ['analysis', 'suggestion', 'fix_plan'], default: 'analysis' },
    modelUsed:        String,
    promptTokens:     Number,
    completionTokens: Number,
    totalTokens:      Number,
    costUsd:          Number,
    latencyMs:        Number,
    success:          Boolean,
    errorMsg:         String,
  },
  { timestamps: true }
);
aiCallLogSchema.index({ merchantId: 1, createdAt: -1 });
aiCallLogSchema.index({ createdAt: -1 });
export const AiCallLog = mongoose.model('AiCallLog', aiCallLogSchema);