import mongoose from 'mongoose';
import { DEFAULT_LOGO } from '../../constants/enums.constant';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';

const widgetSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
      default: DEFAULT_LOGO,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    theme: {
      type: String,
    },
    primaryColor: {
      type: String,
    },
    secondaryColor: {
      type: String,
    },
    placement: {
      type: String,
      enum: ['bottom_right', 'bottom_left', 'top_left', 'top_right'],
    },
    tone: {
      type: String,
    },
    responseType: {
      type: String,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.USER,
    },
    prompts: {
      type: [String],
    },
    chatActiveTime: {
      type: Number,
      default: 60,
    },
    widgetRole: {
      type: String,
    },
    meta: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Widget = mongoose.model(DATABASE_COLLECTIONS_REF.WIDGET, widgetSchema);
export default Widget;
