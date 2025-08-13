import mongoose, { Document, ObjectId, Schema } from 'mongoose';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';

export interface IImportJob extends Document<ObjectId> {
  userId: ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    newCustomersCount: number;
    discardedRowsCount: number;
    segmentId: string;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const importJobSchema = new Schema<IImportJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: DATABASE_COLLECTIONS_REF.USER,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      required: true,
    },
    result: {
      newCustomersCount: { type: Number },
      discardedRowsCount: { type: Number },
      segmentId: { type: String },
    },
    error: { type: String },
  },
  { timestamps: true },
);

export const ImportJob = mongoose.model<IImportJob>(
  DATABASE_COLLECTIONS_REF.IMPORT_JOB,
  importJobSchema,
);
