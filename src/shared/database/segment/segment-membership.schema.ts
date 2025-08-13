import mongoose, { Document, ObjectId, Schema } from 'mongoose';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';

export interface ISegmentMembership extends Document {
  segmentId: ObjectId;
  customerId: ObjectId;
  isActive: boolean;
}

// segment membership model schema
const segmentMembershipSchema = new Schema(
  {
    segmentId: {
      type: Schema.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.SEGMENT,
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.CUSTOMER,
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

segmentMembershipSchema.index({ segmentId: 1, customerId: 1 }, { unique: true });

export const SegmentMembership = mongoose.model<ISegmentMembership>(
  DATABASE_COLLECTIONS_REF.SEGMENT_MEMBERSHIP,
  segmentMembershipSchema,
);
