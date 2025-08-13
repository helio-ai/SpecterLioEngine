import { Document, Schema, Types, model } from 'mongoose';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';

export interface IAttributionDoc extends Document<Types.ObjectId> {
  widgetId: Types.ObjectId;
  sessionId: string;
  customerId: string;
  orderId: string;
  source: string;
  medium: string;
  campaign: string;
  productHandles: string[];
  variantIds: string[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const attributionSchema = new Schema({
  widgetId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: DATABASE_COLLECTIONS_REF.WIDGET,
  },
  sessionId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  orderId: { type: String, required: true, index: true },
  source: { type: String, required: true },
  medium: { type: String },
  campaign: { type: String },
  productHandles: { type: [String], default: [] },
  variantIds: [{ type: String }],
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
});

// Create compound indexes for better query performance
attributionSchema.index({ widgetId: 1, sessionId: 1, customerId: 1 });
attributionSchema.index({ orderId: 1 }, { unique: true });
attributionSchema.index({ widgetId: 1, source: 1, medium: 1, campaign: 1 });
attributionSchema.index({ widgetId: 1, createdAt: -1 });

// Update the updatedAt field on save
attributionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Attribution = model<IAttributionDoc>(DATABASE_COLLECTIONS_REF.ATTRIBUTION, attributionSchema);

export { Attribution };
