import mongoose, { Schema, Types } from 'mongoose';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';
import { WHATSAPP_TEMPLATE_CATEGORY } from '../../constants/whatsapp.constant';

export const WHATSAPP_TEMPLATE_STATUS = {
  PENDING: 'PENDING',
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  FAILED: 'FAILED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DISABLED: 'DISABLED',
  IN_REVIEW: 'IN_REVIEW',
} as const;

interface NamedParamExample {
  param_name: string;
  example: string;
}

interface HeaderTextComponent {
  type: 'HEADER';
  format: 'TEXT';
  text: string;
  example: {
    header_text_named_params: NamedParamExample[];
  };
}

interface HeaderImageComponent {
  type: 'HEADER';
  format: 'IMAGE';
  example: {
    header_handle: string[];
  };
}

export type HeaderComponent = HeaderTextComponent | HeaderImageComponent;

export interface BodyComponent {
  type: 'BODY';
  text: string;
  example: {
    body_text_named_params: NamedParamExample[];
  };
}

export interface FooterComponent {
  type: 'FOOTER';
  text: string;
}

export interface ButtonsComponent {
  type: 'BUTTONS';
  buttons: BlueprintButton[];
}

export interface CarouselBlueprintComponent {
  type: 'CAROUSEL';
  cards: CarouselCardBlueprint[];
}

export interface CarouselCardBlueprint {
  components: [
    HeaderBlueprintComponent,
    ButtonsBlueprintComponent,
    // BODY is optional at blueprint stage if you put text in the top-level BODY component
  ];
}

export interface HeaderBlueprintComponent {
  type: 'HEADER';
  /** must be identical across all cards */
  format: 'IMAGE' | 'VIDEO';
  example: {
    header_url?: string[]; // IMAGE/VIDEO
    header_handle: string[]; // media ID handle
  };
}

export interface ButtonsBlueprintComponent {
  type: 'BUTTONS';
  /** 1–2 buttons; button types must match across cards */
  buttons: [BlueprintButton] | [BlueprintButton, BlueprintButton];
}

export type BlueprintButton =
  | { type: 'QUICK_REPLY'; text: string } // ≤25 chars
  | { type: 'URL'; text: string; url: string; example: string[] }
  | { type: 'PHONE_NUMBER'; text: string; phone_number: string };

export type TemplateComponent =
  | HeaderComponent
  | BodyComponent
  | FooterComponent
  | ButtonsComponent
  | CarouselBlueprintComponent;

export interface WhatsappTemplateDoc extends mongoose.Document<Types.ObjectId> {
  name: string;
  language: string;
  category: string;
  components: TemplateComponent[];
  defaultData: Record<string, any>;
  variables: Record<string, any>;
  userId: Types.ObjectId;
  status: (typeof WHATSAPP_TEMPLATE_STATUS)[keyof typeof WHATSAPP_TEMPLATE_STATUS];
  whatsAppTemplateId: string;
  errorMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

const whatsappTemplateSchema = new mongoose.Schema<WhatsappTemplateDoc>(
  {
    name: { type: String, required: true },
    language: { type: String, required: true },
    category: {
      type: String,
      enum: [WHATSAPP_TEMPLATE_CATEGORY.UTILITY, WHATSAPP_TEMPLATE_CATEGORY.MARKETING],
      required: true,
    },
    components: { type: Schema.Types.Mixed, required: true },
    variables: { type: Schema.Types.Mixed, required: true },
    defaultData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.USER,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(WHATSAPP_TEMPLATE_STATUS),
      default: WHATSAPP_TEMPLATE_STATUS.PENDING,
    },
    whatsAppTemplateId: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true },
);

export interface IWhatsappBusinessAccount {
  phoneNumberId: string;
  accessToken: string;
  businessNumber: string;
  whatsappBusinessAccountId: string;
  userId: Types.ObjectId;
  widgetId: Types.ObjectId;
  appId: string;
}
const whatsappBusinessAccountSchema = new mongoose.Schema<IWhatsappBusinessAccount>(
  {
    phoneNumberId: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    businessNumber: {
      type: String,
      required: true,
    },
    whatsappBusinessAccountId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.USER,
      required: true,
    },
    widgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.WIDGET,
      required: true,
    },
    appId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const WhatsappBusinessAccount = mongoose.model(
  DATABASE_COLLECTIONS_REF.WHATSAPP_BUSINESS_ACCOUNT,
  whatsappBusinessAccountSchema,
);
const WhatsappTemplate = mongoose.model(
  DATABASE_COLLECTIONS_REF.WHATSAPP_TEMPLATE,
  whatsappTemplateSchema,
);

export { WhatsappBusinessAccount, WhatsappTemplate };
