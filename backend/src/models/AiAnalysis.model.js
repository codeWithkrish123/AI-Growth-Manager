import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true },
    category: { type: String, enum: ['product', 'pricing', 'ux', 'inventory', 'marketing', 'seo'] },
    severity: { type: String, enum: ['critical', 'warning', 'info'] },
    title:          String,
    whyItMatters:   String,
    suggestion:     String,
    fix: {
      type: {
        type: String,
        enum: ['update_product', 'update_price', 'add_metafield', 'add_discount', 'update_collection', 'none'],
      },
      shopifyEndpoint: String,
      shopifyPayload:  mongoose.Schema.Types.Mixed,
      estimatedImpact: String,
    },
  },
  { _id: false }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    merchantId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant',       required: true },
    snapshotId:  { type: mongoose.Schema.Types.ObjectId, ref: 'StoreSnapshot',  required: true },
    shopDomain:  { type: String, required: true },

    healthScore: { type: Number, min: 0, max: 100 },
    summary:     String,
    problems:    [problemSchema],

    // LLM call metadata
    promptTokens:     Number,
    completionTokens: Number,
    modelUsed:        String,
    latencyMs:        Number,

    // Used to skip re-analysis when store data hasn't changed
    metricsHash: { type: String, index: true },

    status: {
      type:    String,
      enum:    ['pending', 'completed', 'failed'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

aiAnalysisSchema.index({ merchantId: 1, createdAt: -1 });
aiAnalysisSchema.index({ snapshotId: 1 });

export const AiAnalysis = mongoose.model('AiAnalysis', aiAnalysisSchema);