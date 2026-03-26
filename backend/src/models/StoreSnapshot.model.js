import mongoose from 'mongoose';

const storeSnapshotSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    shopDomain: { type: String, required: true },

    metrics: {
      totalRevenue:       { type: Number, default: 0 },
      orderCount:         { type: Number, default: 0 },
      avgOrderValue:      { type: Number, default: 0 },
      totalSessions:      { type: Number, default: 0 },
      conversionRate:     { type: Number, default: 0 },
      checkoutsInitiated: { type: Number, default: 0 },
      checkoutsCompleted: { type: Number, default: 0 },
      cartAbandonRate:    { type: Number, default: 0 },
      totalCustomers:     { type: Number, default: 0 },
      newCustomers:       { type: Number, default: 0 },
      returningCustomers: { type: Number, default: 0 },
      returningRate:      { type: Number, default: 0 },
      totalProducts:      { type: Number, default: 0 },
      activeProducts:     { type: Number, default: 0 },
      outOfStockCount:    { type: Number, default: 0 },
      noDescriptionCount: { type: Number, default: 0 },
      noImageCount:       { type: Number, default: 0 },
      revenue30d:         { type: Number, default: 0 },
      orders30d:          { type: Number, default: 0 },
      aov30d:             { type: Number, default: 0 },
    },

    topProducts: [
      {
        productId: String,
        title:     String,
        revenue:   Number,
        unitsSold: Number,
      },
    ],

    healthScore: { type: Number, min: 0, max: 100 },

    healthBreakdown: {
      conversionScore: Number,
      abandonScore:    Number,
      aovScore:        Number,
      productScore:    Number,
      inventoryScore:  Number,
      retentionScore:  Number,
    },

    syncedAt:        { type: Date, default: Date.now },
    dataWindowDays:  { type: Number, default: 90 },
  },
  { timestamps: true }
);

storeSnapshotSchema.index({ merchantId: 1, syncedAt: -1 });
storeSnapshotSchema.index({ shopDomain: 1, syncedAt: -1 });

export const StoreSnapshot = mongoose.model('StoreSnapshot', storeSnapshotSchema);