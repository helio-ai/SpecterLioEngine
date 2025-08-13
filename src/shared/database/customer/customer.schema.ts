import { Document, Schema, Types, model } from 'mongoose';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';
// import { parsePhoneNumber } from '@/core/utils/common.utils'

export interface ICustomerDoc extends Document<Types.ObjectId> {
  widgetId: Types.ObjectId;
  shopifyId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  instagramId: string;
  instagramUsername: string;
  numberOfOrders: number;
  amountSpent: {
    amount: number;
    currencyCode: string;
  };
  tags: string[];
  defaultAddress: {
    city: string;
    province: string;
    country: string;
  };
  verifiedEmail: boolean;
  validEmailAddress: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema({
  uniqueId: { type: String, index: true, default: '' },
  widgetId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: DATABASE_COLLECTIONS_REF.WIDGET,
  },
  shopifyId: { type: String, default: null },
  email: { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  phone: {
    type: String,
    default: '',
    // validate: {
    //   validator: async (v: any) => parsePhoneNumber(v),
    // },
  },
  instagramId: { type: String, default: '' },
  instagramUsername: { type: String, default: '' },
  numberOfOrders: { type: Number, default: 0 },
  amountSpent: {
    amount: { type: Number, default: 0 },
    currencyCode: { type: String, default: '' },
  },
  verifiedEmail: { type: Boolean, default: false },
  validEmailAddress: { type: Boolean, default: false },
  tags: [{ type: String }],
  defaultAddress: {
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  createdBy: {
    type: String,
    enum: ['shopify-sync', 'shopify-create', 'helio', 'widget-bot-sync'],
  },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
});

const Customer = model(DATABASE_COLLECTIONS_REF.CUSTOMER, customerSchema);

customerSchema.index({ widgetId: 1, phone: 1 }, { unique: true });

export { Customer };
