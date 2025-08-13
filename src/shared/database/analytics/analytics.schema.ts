import mongoose from 'mongoose';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';

const analyticsSchema = new mongoose.Schema(
  {
    widgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.WIDGET,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    cartCount: {
      type: Number,
      default: 0,
    },
    viewProductPageCount: {
      type: Number,
      default: 0,
    },
    productPagePromptCount: {
      type: Number,
      default: 0,
    },
    productPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

analyticsSchema.index({ widgetId: 1, productId: 1 }, { unique: true });

const Analytics = mongoose.model(DATABASE_COLLECTIONS_REF.ANALYTICS, analyticsSchema);
export default Analytics;
