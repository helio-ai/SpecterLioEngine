import mongoose from 'mongoose';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';

const contextSchema = new mongoose.Schema(
  {
    additionalContext: {
      type: String,
    },
    websiteUrls: {
      type: [String],
    },
    mainUrl: {
      type: String,
    },
    widgetId: {
      type: mongoose.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.WIDGET,
      required: true,
    },
    uploadedFiles: {
      type: [String],
    },
    products: {
      type: [String],
    },
    addedBy: {
      type: mongoose.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.USER,
    },
    productsMeta: {
      type: {
        currency: {
          type: String,
          default: '₹',
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

const Context = mongoose.model(DATABASE_COLLECTIONS_REF.CONTEXT, contextSchema);
export default Context;
