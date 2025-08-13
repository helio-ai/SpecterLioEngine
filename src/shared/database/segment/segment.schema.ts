import mongoose, { Document, ObjectId, Schema } from 'mongoose';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';

export interface ISegment extends Document<ObjectId> {
  name: string;
  widgetId: ObjectId;
  rule: string;
  method: string;
  autoUpdate: boolean;
  createdBy: ObjectId;
}
export interface ICombination extends Document {
  widgetId: ObjectId;
  combinations: string;
}

// segment model schema
const segmentSchema = new Schema<ISegment>(
  {
    name: { type: String, required: true },
    widgetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: DATABASE_COLLECTIONS_REF.WIDGET,
    },
    rule: { type: Schema.Types.String, required: true },
    method: { type: String, required: true }, //  filters, excel
    autoUpdate: { type: Boolean, default: false },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.USER,
    },
  },
  { timestamps: true },
);

// event combination model schema
const eventCombinationSchema = new Schema<ICombination>(
  {
    widgetId: {
      type: Schema.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.WIDGET,
      required: true,
      index: true,
    },
    combinations: { type: String, required: true },
  },
  { timestamps: true },
);

const EventCombination = mongoose.model<ICombination>(
  DATABASE_COLLECTIONS_REF.EVENT_COMBINATION,
  eventCombinationSchema,
);
const Segment = mongoose.model<ISegment>(DATABASE_COLLECTIONS_REF.SEGMENT, segmentSchema);
export { Segment, EventCombination };
