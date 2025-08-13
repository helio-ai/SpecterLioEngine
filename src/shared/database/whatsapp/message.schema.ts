// import { WhatsAppError } from '@/apps/whatsapp/types/whatsapp.types'
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';
// import { UntypedDocumentRecord } from '@/core/utils/model.utils'
import mongoose, { Types, Schema, Document } from 'mongoose';
export interface EngagementCounters {
  // add keys whenever a new metric shows up
  clicks?: number;
}

export type WaMessageStatus =
  | 'scheduled'
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'retrying'
  | 'processed';

export interface TemplateMessageDoc extends Document<Types.ObjectId> {
  phone: string;
  sourceType: string;
  sourceId: Types.ObjectId;
  metrics: EngagementCounters;
  trackingId: string;
  customer: Types.ObjectId;
  status: WaMessageStatus;
  cost: Cost;
  sendAttempt: number;
  failureReason?: string;
  errorHistory?: any[];
  scheduledAt?: Date;
}

const engagementCountersSchema = new Schema<EngagementCounters>(
  {
    clicks: { type: Number, default: 0 },
  },
  { _id: false },
);

type Cost = {
  currency: 'INR';
  amount: number;
};

const costSchema = new Schema<Cost>(
  {
    currency: { type: String, default: 'INR' },
    amount: { type: Number, default: 0 },
  },
  { _id: false },
);

const TemplateMessageSchema = new Schema<TemplateMessageDoc>(
  {
    phone: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      enum: [
        DATABASE_COLLECTIONS_REF.CAMPAIGN_COLLECTION_NAME,
        DATABASE_COLLECTIONS_REF.STATE_EXECUTION,
      ],
      required: true,
    },
    metrics: {
      type: engagementCountersSchema,
      default: { clicks: 0 } satisfies EngagementCounters,
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      // TODO: add ref
      required: true,
    },
    trackingId: {
      type: String,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: DATABASE_COLLECTIONS_REF.CUSTOMER,
    },
    status: {
      type: String,
      enum: [
        'scheduled',
        'pending',
        'sent',
        'delivered',
        'read',
        'failed',
        'retrying',
      ] satisfies WaMessageStatus[],
      required: true,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    sendAttempt: {
      // Added field
      type: Number,
      default: 0,
    },
    errorHistory: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    scheduledAt: {
      type: Date,
    },
    cost: {
      type: costSchema,
      default: { currency: 'INR', amount: 0 } satisfies Cost,
    },
  },
  {
    collection: DATABASE_COLLECTIONS_REF.WHATSAPP_MESSAGE_COLLECTION_NAME,
    timestamps: true,
  },
);

TemplateMessageSchema.index({ sourceType: 1, sourceId: 1 });

export const TemplateMessage = mongoose.model(
  DATABASE_COLLECTIONS_REF.WHATSAPP_MESSAGE_COLLECTION_NAME,
  TemplateMessageSchema,
);
