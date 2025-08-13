import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';
import mongoose, { Document, Types, Schema } from 'mongoose';

export interface CampaignDoc extends Document<Types.ObjectId> {
  widgetId: Types.ObjectId;
  phone: string;
  name: string;
  template: Types.ObjectId;
  description?: string;
  staticData: StaticData;
  scheduledAt: Date;
  config: {
    retry: { delay: number }[];
    enableUtm: boolean;
    dryRun: boolean;
  };
  segments: {
    targets: {
      type: [Types.ObjectId];
      required: true;
      ref: DATABASE_COLLECTIONS_REF.SEGMENT;
    };
    excluded: {
      type: [Types.ObjectId];
      required: true;
      ref: DATABASE_COLLECTIONS_REF.SEGMENT;
    };
  };
  status: 'queued' | 'scheduled' | 'completed' | 'failed' | 'processing';
  metrics: {
    totalRecipients: number;
    processed: number;
    sent: number;
    click: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

export interface StaticData {
  header?: {
    type: 'image' | 'text';
    value: string;
  };
  /**
   * Body only supports text variables.
   *
   * @example
   * {
   *   "customer_name": "John Doe",
   *   "product_name": "Product Name"
   * }
   */
  preDefinedBody?: Record<string, string>;
  dynamicBody?: any[];
  buttons?: StaticDataButton[];
  carousel?: CarouselCard[];
}

export type StaticDataButton = {
  index: number;
  type: 'URL' | 'QUICK_REPLY';
  value: string;
};

export interface CarouselCard {
  header: {
    type: 'image';
    value: string;
  };
  buttons: StaticDataButton[];
}

// Sub-schema for the optional header
const HeaderSchema = new Schema(
  {
    type: { type: String, enum: ['image'], required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const buttonSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['URL', 'QUICK_REPLY'] satisfies CarouselCard['buttons'][number]['type'][],
      required: true,
    },
    index: { type: Number, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const CarouselCardSchema = new Schema<CarouselCard>(
  {
    header: { type: HeaderSchema, required: true },
    buttons: { type: [buttonSchema], required: true },
  },
  { _id: false },
);

export const staticDataSchema = new Schema<StaticData>(
  {
    header: { type: HeaderSchema, required: false },
    preDefinedBody: {
      type: Map,
      of: String,
      required: false,
    },
    dynamicBody: {
      type: [String],
      required: false,
    },
    buttons: {
      type: [buttonSchema],
      required: false,
    },
    carousel: {
      type: [CarouselCardSchema],
      required: false,
    },
  },
  { _id: false },
);

export const segmentSchema = new Schema<CampaignDoc['segments']>(
  {
    targets: {
      type: [Types.ObjectId],
      required: true,
      ref: DATABASE_COLLECTIONS_REF.SEGMENT,
    },
    excluded: {
      type: [Types.ObjectId],
      required: true,
      ref: DATABASE_COLLECTIONS_REF.SEGMENT,
    },
  },
  { _id: false },
);

const DelaySchema = new Schema(
  {
    delay: { type: Number, required: true },
  },
  { _id: false },
);

const ConfigurationSchema = new Schema<CampaignDoc['config']>(
  {
    retry: {
      type: [DelaySchema],
      required: true,
    },
    dryRun: { type: Boolean, default: false },
    enableUtm: { type: Boolean, default: true },
  },
  { _id: false },
);

const MetricsSchema = new Schema(
  {
    totalRecipients: { type: Number, default: 0 },
    processed: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    click: { type: Number, default: 0 },
  },
  { _id: false },
);

const CampaignSchema = new Schema<CampaignDoc>(
  {
    widgetId: {
      type: Schema.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.WIDGET,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    template: {
      type: Schema.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.WHATSAPP_TEMPLATE,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    staticData: { type: staticDataSchema, required: true },
    segments: {
      type: segmentSchema,
      required: true,
    },
    config: {
      type: ConfigurationSchema,
      default: () => ({ retry: [] }),
    },
    metrics: {
      type: MetricsSchema,
      default: () => ({}), // Provide default object for the subdocument
    },
    status: {
      type: Schema.Types.String,
      enum: [
        'scheduled',
        'processing',
        'completed',
        'failed',
        'queued',
      ] satisfies CampaignDoc['status'][],
      required: true,
    },
  } satisfies any,
  {
    collection: DATABASE_COLLECTIONS_REF.CAMPAIGN_COLLECTION_NAME,
    timestamps: true,
  },
);

export const CampaignModel = mongoose.model(
  DATABASE_COLLECTIONS_REF.CAMPAIGN_COLLECTION_NAME,
  CampaignSchema,
);
